import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileAttachment {
  id: string;
  order_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by?: string;
  uploaded_at: string;
  description?: string;
}

interface UploadProgress {
  fileIndex: number;
  progress: number;
}

export const useOrderAttachments = (orderId?: string) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch attachments for a specific order
  const {
    data: attachments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['order-attachments', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('order_attachments')
        .select('*')
        .eq('order_id', orderId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as FileAttachment[];
    },
    enabled: !!orderId,
  });

  // Upload files mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async ({ files, orderId: targetOrderId }: { files: File[]; orderId: string }) => {
      const uploadResults = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${targetOrderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Update progress
        setUploadProgress(prev => [
          ...prev.filter(p => p.fileIndex !== i),
          { fileIndex: i, progress: 0 }
        ]);

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('order-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Update progress
        setUploadProgress(prev => [
          ...prev.filter(p => p.fileIndex !== i),
          { fileIndex: i, progress: 50 }
        ]);

        // Save metadata to database
        const { data: attachmentData, error: dbError } = await supabase
          .from('order_attachments')
          .insert({
            order_id: targetOrderId,
            file_name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            file_type: file.type,
          })
          .select()
          .single();

        if (dbError) {
          // Clean up uploaded file if database insert fails
          await supabase.storage
            .from('order-attachments')
            .remove([fileName]);
          throw dbError;
        }

        // Update progress
        setUploadProgress(prev => [
          ...prev.filter(p => p.fileIndex !== i),
          { fileIndex: i, progress: 100 }
        ]);

        uploadResults.push(attachmentData);
      }

      // Clear progress
      setTimeout(() => setUploadProgress([]), 1000);
      
      return uploadResults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-attachments', orderId] });
      toast({
        title: "Файлы загружены",
        description: "Файлы успешно прикреплены к заказу",
      });
    },
    onError: (error) => {
      setUploadProgress([]);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файлы",
        variant: "destructive"
      });
      console.error('Upload error:', error);
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('order_attachments')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('order-attachments')
        .remove([fileData.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('order_attachments')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-attachments', orderId] });
      toast({
        title: "Файл удален",
        description: "Файл успешно удален",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить файл",
        variant: "destructive"
      });
      console.error('Delete error:', error);
    }
  });

  // Download file function
  const downloadFile = async (file: FileAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('order-attachments')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Файл загружен",
        description: `Файл ${file.file_name} успешно загружен`,
      });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файл",
        variant: "destructive"
      });
      console.error('Download error:', error);
    }
  };

  // Get file URL for preview
  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('order-attachments')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  return {
    attachments,
    isLoading,
    error,
    refetch,
    uploadFiles: uploadFilesMutation.mutate,
    isUploading: uploadFilesMutation.isPending,
    uploadProgress,
    deleteFile: deleteFileMutation.mutate,
    isDeleting: deleteFileMutation.isPending,
    downloadFile,
    getFileUrl,
  };
};
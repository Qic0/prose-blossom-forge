import React, { useState } from 'react';
import { Download, Trash2, File, Image, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FileAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  description?: string;
}

interface FileAttachmentsListProps {
  files: FileAttachment[];
  onDownload: (file: FileAttachment) => void;
  onDelete: (fileId: string) => void;
  onPreview?: (file: FileAttachment) => void;
  readonly?: boolean;
}

export const FileAttachmentsList: React.FC<FileAttachmentsListProps> = ({
  files,
  onDownload,
  onDelete,
  onPreview,
  readonly = false
}) => {
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const { toast } = useToast();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (fileId: string) => {
    setDeletingFile(fileId);
    try {
      await onDelete(fileId);
      toast({
        title: "Файл удален",
        description: "Файл успешно удален",
      });
    } catch (error) {
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить файл",
        variant: "destructive"
      });
    } finally {
      setDeletingFile(null);
    }
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  if (files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 text-muted-foreground"
      >
        <File className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Нет прикрепленных файлов</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <File className="h-4 w-4" />
          Прикрепленные файлы ({files.length})
        </h4>
        <Badge variant="secondary" className="text-xs">
          {files.reduce((acc, file) => acc + file.file_size, 0) > 1024 * 1024
            ? `${(files.reduce((acc, file) => acc + file.file_size, 0) / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(files.reduce((acc, file) => acc + file.file_size, 0) / 1024)} KB`}
        </Badge>
      </div>

      <AnimatePresence>
        {files.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-muted-foreground min-w-[24px]">
                      {index + 1}.
                    </span>
                    {getFileIcon(file.file_type)}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium truncate">
                        {file.file_name}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploaded_at)}</span>
                      </div>
                      {file.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {file.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {isImage(file.file_type) && onPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreview(file)}
                        className="hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(file)}
                      className="hover:bg-green-50"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    {!readonly && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={deletingFile === file.id}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить файл?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить файл "{file.file_name}"? 
                              Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(file.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
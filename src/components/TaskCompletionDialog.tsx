import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Task = Database['public']['Tables']['zadachi']['Row'];

interface TaskCompletionDialogProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TaskCompletionDialog: React.FC<TaskCompletionDialogProps> = ({
  task,
  isOpen,
  onClose,
  onComplete
}) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file: File, taskId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}-${Date.now()}.${fileExt}`;
      const filePath = `task-completion/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('order-attachments')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('order-attachments')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleCompleteTask = async () => {
    if (!photo) {
      toast({
        title: "Ошибка",
        description: "Необходимо прикрепить фото для завершения задачи",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload photo
      const photoUrl = await uploadPhoto(photo, task.uuid_zadachi);
      
      if (!photoUrl) {
        throw new Error('Failed to upload photo');
      }

      // Update task - send to dispatcher review
      const { error } = await supabase
        .from('zadachi')
        .update({
          status: 'under_review',
          checklist_photo: photoUrl,
          is_locked: true
        })
        .eq('uuid_zadachi', task.uuid_zadachi);

      if (error) {
        throw error;
      }

      // Зарплата будет начислена после подтверждения диспетчером
      // Задача отправляется на проверку со статусом 'completed'

      onComplete();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить задачу. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFirstConfirm = () => {
    if (!photo) {
      toast({
        title: "Ошибка",
        description: "Необходимо прикрепить фото для завершения задачи",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmation(true);
  };

  const resetDialog = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setShowConfirmation(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Завершение задачи</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{task.description}</p>
            {(() => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              const penaltyAmount = task.salary ? Math.round(task.salary * 0.9) : 0;
              
              if (isOverdue) {
                return (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-red-600 line-through">
                      Оплата: {task.salary} ₽
                    </p>
                    <p className="text-xs text-red-500">
                      Штраф 10% за просрочку
                    </p>
                    <p className="text-sm font-bold text-red-700">
                      К оплате: {penaltyAmount} ₽
                    </p>
                  </div>
                );
              }
              
              return (
                <p className="text-sm font-medium text-green-600 mt-2">
                  Оплата: {task.salary} ₽
                </p>
              );
            })()}
          </div>

          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              Для завершения задачи необходимо прикрепить фотографию выполненной работы
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <label htmlFor="photo" className="block text-sm font-medium">
              Прикрепить фото работы *
            </label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            
            {photoPreview && (
              <div className="mt-3">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!showConfirmation ? (
              <>
                <Button
                  onClick={handleFirstConfirm}
                  className="flex-1"
                  disabled={!photo}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Завершить задачу
                </Button>
                <Button variant="outline" onClick={resetDialog}>
                  Отмена
                </Button>
              </>
            ) : (
              <>
                <div className="w-full">
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Вы уверены, что хотите завершить эту задачу? Это действие нельзя отменить.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCompleteTask}
                      disabled={loading}
                      className="flex-1"
                      variant="destructive"
                    >
                      {loading ? "Завершение..." : "Да, завершить"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmation(false)}
                      disabled={loading}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCompletionDialog;
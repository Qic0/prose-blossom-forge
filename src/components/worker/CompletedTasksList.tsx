import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

interface CompletedTask {
  uuid_zadachi: string;
  title: string;
  salary: number | null;
  completed_at: string;
  execution_time_seconds: number | null;
}

interface CompletedTasksListProps {
  tasks: CompletedTask[];
}

// Working with UTC time directly

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const CompletedTasksList = ({ tasks }: CompletedTasksListProps) => {
  const today = new Date();
  const todayTasks = tasks.filter(task => {
    const completedDate = new Date(task.completed_at);
    return completedDate.toDateString() === today.toDateString();
  });

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Выполнено сегодня
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Пока нет выполненных задач
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {todayTasks.map(task => (
                <div 
                  key={task.uuid_zadachi}
                  className="bg-muted/50 rounded-lg p-3 space-y-2 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium line-clamp-2 flex-1">
                      {task.title}
                    </span>
                    <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0">
                      +{formatCurrency(task.salary || 0)} ₽
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {task.execution_time_seconds && (
                      <span>
                        {Math.floor(task.execution_time_seconds / 3600)}ч {Math.floor((task.execution_time_seconds % 3600) / 60)}м
                      </span>
                    )}
                    <span className="ml-auto">
                      {format(new Date(task.completed_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletedTasksList;

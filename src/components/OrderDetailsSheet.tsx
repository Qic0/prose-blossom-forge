import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Order } from "./KanbanBoard";
import { Calendar, User, Phone, Mail, Building, MessageSquare, Clock, FileText, Tag } from "lucide-react";

interface OrderDetailsSheetProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const getPriorityColor = (priority: Order['priority']) => {
  const colors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-warning/10 text-warning-foreground',
    high: 'bg-destructive/10 text-destructive'
  };
  return colors[priority];
};

const getPriorityText = (priority: Order['priority']) => {
  const texts = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий'
  };
  return texts[priority];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
};

const OrderDetailsSheet = ({ order, isOpen, onClose }: OrderDetailsSheetProps) => {
  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle className="font-display font-bold text-xl tracking-tight">
            {order.title}
          </SheetTitle>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="secondary" 
              className={`${getPriorityColor(order.priority)} font-display font-bold`}
            >
              {getPriorityText(order.priority)} приоритет
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg">Основная информация</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Клиент</p>
                  <p className="font-semibold">{order.client}</p>
                </div>
              </div>

              {order.company && (
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Компания</p>
                    <p className="font-semibold">{order.company}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm text-muted-foreground">Стоимость</p>
                  <p className="font-semibold text-lg font-display">
                    {formatCurrency(order.value)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ответственный</p>
                  <p className="font-semibold">{order.assignee}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Контактная информация */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg">Контакты</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {order.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Телефон</p>
                    <p className="font-semibold">{order.phone}</p>
                  </div>
                </div>
              )}

              {order.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{order.email}</p>
                  </div>
                </div>
              )}

              {order.source && (
                <div className="flex items-center space-x-3">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Источник</p>
                    <p className="font-semibold">{order.source}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Даты */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg">Временные рамки</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Дата создания</p>
                  <p className="font-semibold">{formatDate(order.createdDate)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Дедлайн</p>
                  <p className="font-semibold">{formatDate(order.dueDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Описание */}
          {order.description && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg">Описание проекта</h3>
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">
                    {order.description}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Комментарии */}
          {order.comments && order.comments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg">Комментарии</h3>
                <div className="space-y-3">
                  {order.comments.map((comment, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <MessageSquare className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Действия */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg">Действия</h3>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="default" className="w-full">
                Редактировать заказ
              </Button>
              <Button variant="outline" className="w-full">
                Добавить комментарий
              </Button>
              <Button variant="outline" className="w-full">
                История изменений
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsSheet;
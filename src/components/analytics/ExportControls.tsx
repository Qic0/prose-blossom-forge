import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileImage, FileText, Mail, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ExportControlsProps {
  onExport: (format: string, components?: string[]) => void;
}

export const ExportControls = ({ onExport }: ExportControlsProps) => {
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const { toast } = useToast();

  const exportFormats = [
    { value: 'png', label: 'PNG изображение', icon: FileImage },
    { value: 'pdf', label: 'PDF отчёт', icon: FileText },
    { value: 'csv', label: 'CSV данные', icon: Download },
  ];

  const availableComponents = [
    { value: 'kpi', label: 'KPI карточки' },
    { value: 'revenue', label: 'График доходов' },
    { value: 'distribution', label: 'Распределение' },
    { value: 'heatmap', label: 'Календарь' },
    { value: 'table', label: 'Таблица' },
  ];

  const handleExport = (format: string) => {
    onExport(format, selectedComponents);
    toast({
      title: "Экспорт запущен",
      description: `Подготовка отчёта в формате ${format.toUpperCase()}...`,
    });
  };

  const scheduleReport = () => {
    toast({
      title: "Расписание создано",
      description: "Еженедельный отчёт будет отправляться по email",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Download className="h-4 w-4" />
              <span>Экспорт:</span>
            </div>

            {/* Export Format Buttons */}
            <div className="flex space-x-2">
              {exportFormats.map(format => {
                const Icon = format.icon;
                return (
                  <Button
                    key={format.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(format.value)}
                    className="h-8"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {format.label}
                  </Button>
                );
              })}
            </div>

            {/* Component Selection */}
            <Select
              value=""
              onValueChange={(value) => {
                const newComponents = selectedComponents.includes(value)
                  ? selectedComponents.filter(c => c !== value)
                  : [...selectedComponents, value];
                setSelectedComponents(newComponents);
              }}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Выбрать компоненты" />
              </SelectTrigger>
              <SelectContent>
                {availableComponents.map(component => (
                  <SelectItem key={component.value} value={component.value}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedComponents.includes(component.value)}
                        onChange={() => {}}
                        className="h-3 w-3"
                      />
                      <span className="text-xs">{component.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Schedule Report */}
            <Button
              variant="outline"
              size="sm"
              onClick={scheduleReport}
              className="h-8"
            >
              <Mail className="h-3 w-3 mr-1" />
              <Calendar className="h-3 w-3 mr-1" />
              <span className="text-xs">Расписание</span>
            </Button>

            {/* Selected Components Display */}
            {selectedComponents.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-2">
                {selectedComponents.map(component => {
                  const componentData = availableComponents.find(c => c.value === component);
                  return (
                    <span
                      key={component}
                      className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs flex items-center space-x-1"
                    >
                      <span>{componentData?.label}</span>
                      <button
                        onClick={() => setSelectedComponents(prev => prev.filter(c => c !== component))}
                        className="hover:bg-primary/30 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
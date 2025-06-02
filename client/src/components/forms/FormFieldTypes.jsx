import { Type, Calendar, ChevronDown, CheckSquare, Hash, Mail, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fieldTypes = [
  {
    type: 'text',
    label: 'Text Input',
    icon: Type,
    description: 'Single line text input'
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: FileText,
    description: 'Multi-line text input'
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Email address input'
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: Phone,
    description: 'Phone number input'
  },
  {
    type: 'number',
    label: 'Number',
    icon: Hash,
    description: 'Numeric input'
  },
  {
    type: 'date',
    label: 'Date',
    icon: Calendar,
    description: 'Date picker input'
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    icon: ChevronDown,
    description: 'Single selection dropdown'
  },
  {
    type: 'multiselect',
    label: 'Multi-select',
    icon: CheckSquare,
    description: 'Multiple selection checkboxes'
  }
];

export function FormFieldTypes({ onAddField }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {fieldTypes.map((fieldType) => {
            const Icon = fieldType.icon;
            return (
              <Button
                key={fieldType.type}
                variant="ghost"
                className="h-auto p-3 justify-start"
                onClick={() => onAddField(fieldType.type)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{fieldType.label}</div>
                    <div className="text-xs text-gray-500">{fieldType.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
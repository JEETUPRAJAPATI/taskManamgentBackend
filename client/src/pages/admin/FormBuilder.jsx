import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Plus, Save, Eye, Share2, Settings, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FormFieldTypes } from '@/components/forms/FormFieldTypes';
import { FormPreview } from '@/components/forms/FormPreview';
import { FormSettings } from '@/components/forms/FormSettings';

export default function FormBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    fields: [],
    settings: {
      allowAnonymous: true,
      submitMessage: 'Thank you for your submission!'
    }
  });
  
  const [selectedField, setSelectedField] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch forms
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['/api/forms'],
  });

  // Create form mutation
  const createFormMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create form');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/forms']);
      toast({ title: 'Success', description: 'Form created successfully!' });
      setForm({
        title: '',
        description: '',
        fields: [],
        settings: { allowAnonymous: true, submitMessage: 'Thank you for your submission!' }
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create form', variant: 'destructive' });
    }
  });

  // Update form mutation
  const updateFormMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update form');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/forms']);
      toast({ title: 'Success', description: 'Form updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update form', variant: 'destructive' });
    }
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete form');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/forms']);
      toast({ title: 'Success', description: 'Form deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete form', variant: 'destructive' });
    }
  });

  // Publish form mutation
  const publishFormMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/forms/${id}/publish`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to publish form');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/forms']);
      toast({ title: 'Success', description: 'Form published successfully!' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to publish form', variant: 'destructive' });
    }
  });

  const addField = (fieldType) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: fieldType,
      label: `New ${fieldType} field`,
      placeholder: '',
      required: false,
      options: fieldType === 'dropdown' || fieldType === 'multiselect' ? ['Option 1'] : [],
      order: form.fields.length
    };
    
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedField(newField.id);
  };

  const updateField = (fieldId, updates) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    setSelectedField(null);
  };

  const moveField = (fieldId, direction) => {
    const fieldIndex = form.fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;
    
    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (newIndex < 0 || newIndex >= form.fields.length) return;
    
    const newFields = [...form.fields];
    [newFields[fieldIndex], newFields[newIndex]] = [newFields[newIndex], newFields[fieldIndex]];
    
    setForm(prev => ({ ...prev, fields: newFields }));
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast({ title: 'Error', description: 'Form title is required', variant: 'destructive' });
      return;
    }
    
    if (form.fields.length === 0) {
      toast({ title: 'Error', description: 'Form must have at least one field', variant: 'destructive' });
      return;
    }

    createFormMutation.mutate(form);
  };

  const handlePublish = (formId) => {
    publishFormMutation.mutate(formId);
  };

  const handleDelete = (formId) => {
    if (confirm('Are you sure you want to delete this form?')) {
      deleteFormMutation.mutate(formId);
    }
  };

  const copyShareLink = (accessLink) => {
    const shareUrl = `${window.location.origin}/public/forms/${accessLink}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Success', description: 'Share link copied to clipboard!' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading forms...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Form Builder</h1>
        <Button onClick={() => setShowPreview(true)} variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Details */}
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Form Title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Form Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedField === field.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedField(field.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-gray-500 capitalize">{field.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, 'up');
                          }}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, 'down');
                          }}
                          disabled={index === form.fields.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {form.fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No fields added yet. Add fields from the panel on the right.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button onClick={handleSave} disabled={createFormMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Form
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Field Types & Properties */}
        <div className="space-y-6">
          <FormFieldTypes onAddField={addField} />
          
          {selectedField && (
            <Card>
              <CardHeader>
                <CardTitle>Field Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldProperties
                  field={form.fields.find(f => f.id === selectedField)}
                  onUpdate={(updates) => updateField(selectedField, updates)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Existing Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <div key={form._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{form.title}</h3>
                    <p className="text-sm text-gray-500">{form.description}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {form.isPublished && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyShareLink(form.accessLink)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(form._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {form.fields?.length || 0} fields
                  </span>
                  <div className="flex space-x-2">
                    {form.isPublished ? (
                      <span className="text-green-600">Published</span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handlePublish(form._id)}
                        disabled={publishFormMutation.isPending}
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showPreview && (
        <FormPreview 
          form={form} 
          onClose={() => setShowPreview(false)} 
        />
      )}
      
      {showSettings && (
        <FormSettings
          settings={form.settings}
          onUpdate={(settings) => setForm(prev => ({ ...prev, settings }))}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// Field Properties Component
function FieldProperties({ field, onUpdate }) {
  if (!field) return null;

  const addOption = () => {
    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
    onUpdate({ options: newOptions });
  };

  const updateOption = (index, value) => {
    const newOptions = [...field.options];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = field.options.filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Label</label>
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Placeholder</label>
        <Input
          value={field.placeholder}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="rounded"
        />
        <label className="text-sm">Required field</label>
      </div>

      {(field.type === 'dropdown' || field.type === 'multiselect') && (
        <div>
          <label className="block text-sm font-medium mb-2">Options</label>
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addOption}>
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
          </div>
        </div>
      )}

      {field.type === 'number' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Min Value</label>
            <Input
              type="number"
              value={field.validation?.min || ''}
              onChange={(e) => onUpdate({ 
                validation: { ...field.validation, min: e.target.value } 
              })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Value</label>
            <Input
              type="number"
              value={field.validation?.max || ''}
              onChange={(e) => onUpdate({ 
                validation: { ...field.validation, max: e.target.value } 
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
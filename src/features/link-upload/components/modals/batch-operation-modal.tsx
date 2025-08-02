'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/marketing/animate-ui/radix/dialog';
import {
  Trash2,
  Move,
  FolderIcon,
  FileIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

export interface BatchOperationItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

export interface BatchOperationProgress {
  completed: number;
  total: number;
  currentItem?: string;
  failed: string[];
}

interface BatchOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: 'delete' | 'move';
  items: BatchOperationItem[];
  targetFolder?: string;
  onConfirm: () => void;
  progress?: BatchOperationProgress;
  isProcessing: boolean;
}

export function BatchOperationModal({
  isOpen,
  onClose,
  operation,
  items,
  targetFolder,
  onConfirm,
  progress,
  isProcessing,
}: BatchOperationModalProps) {
  const isDelete = operation === 'delete';
  const isMove = operation === 'move';
  
  const operationConfig = {
    delete: {
      title: 'Delete Items',
      description: 'This action cannot be undone.',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      buttonText: 'Delete',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    move: {
      title: 'Move Items',
      description: `Move selected items to "${targetFolder || 'Unknown'}"`,
      icon: Move,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      buttonText: 'Move',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const config = operationConfig[operation];
  const Icon = config.icon;

  const renderProgressState = () => {
    if (!progress) return null;

    const { completed, total, failed } = progress;
    const isComplete = completed === total;
    const hasErrors = failed.length > 0;
    const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

    if (isComplete) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-lg border ${
            hasErrors ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {hasErrors ? (
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                hasErrors ? 'text-yellow-800' : 'text-green-800'
              }`}>
                {hasErrors ? 'Completed with issues' : 'Operation completed successfully'}
              </h4>
              <p className={`text-sm mt-1 ${
                hasErrors ? 'text-yellow-700' : 'text-green-700'
              }`}>
                {hasErrors ? 
                  `${completed - failed.length} of ${total} items processed successfully` :
                  `All ${total} items processed successfully`
                }
              </p>
              {hasErrors && (
                <div className="mt-2">
                  <p className="text-sm text-yellow-700 font-medium">Errors:</p>
                  <ul className="text-sm text-yellow-600 mt-1 space-y-1">
                    {failed.map((error, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Processing {operation}...
          </span>
          <span className="text-sm text-gray-500">
            {completed} / {total}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {progress.currentItem && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="truncate">{progress.currentItem}</span>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="sr-only">{config.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {config.description}
        </DialogDescription>

        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className={`flex items-center gap-4 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
            <div className={`p-2 rounded-lg bg-white border ${config.borderColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {config.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {config.description}
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <AnimatePresence mode="wait">
            {isProcessing || progress ? (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderProgressState()}
              </motion.div>
            ) : (
              <motion.div
                key="items"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Items List */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    Selected items ({items.length}):
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.type === 'folder' ? (
                          <FolderIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <FileIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        )}
                        <span className="text-sm text-gray-700 truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing && !progress?.completed}
            >
              {progress?.completed ? 'Close' : 'Cancel'}
            </Button>
            
            {(!isProcessing && !progress) && (
              <Button
                onClick={onConfirm}
                className={config.buttonClass}
              >
                <Icon className="w-4 h-4 mr-2" />
                {config.buttonText} {items.length} item{items.length > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
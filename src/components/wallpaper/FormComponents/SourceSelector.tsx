import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  addSavedSource,
  getSavedSources,
  removeSavedSource,
} from '@/lib/firebase';

const DEFAULT_SOURCES = [
  { name: 'Official', icon: '✓' },
  { name: '4K Wallpapers', icon: '🔥' },
  { name: 'hdqwalls', icon: '🎨' },
  { name: 'Unsplash', icon: '📷' },
  { name: 'Pexels', icon: '🖼️' },
  { name: 'Pixabay', icon: '🌟' },
] as const;

interface SourceSelectorProps {
  source: string;
  onSourceChange: (value: string) => void;
  inputId?: string;
  sameSource?: boolean;
  onSameSourceChange?: (checked: boolean) => void;
  showSameSourceCheckbox?: boolean;
}

const SourceSelector: React.FC<SourceSelectorProps> = ({
  source,
  onSourceChange,
  inputId = 'source',
  sameSource = false,
  onSameSourceChange,
  showSameSourceCheckbox = false,
}) => {
  const [savedSources, setSavedSources] = useState<string[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [savingSource, setSavingSource] = useState(false);

  const loadSavedSources = useCallback(async () => {
    setLoadingSaved(true);
    try {
      setSavedSources(await getSavedSources());
    } catch (error) {
      console.error('Error loading saved sources:', error);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    loadSavedSources();
  }, [loadSavedSources]);

  const defaultNames = useMemo(
    () => new Set(DEFAULT_SOURCES.map((s) => s.name.toLowerCase())),
    []
  );

  const customSavedSources = useMemo(
    () => savedSources.filter((name) => !defaultNames.has(name.toLowerCase())),
    [savedSources, defaultNames]
  );

  const trimmedSource = source.trim();
  const canSaveSource =
    trimmedSource.length > 0 &&
    !savedSources.some((s) => s.toLowerCase() === trimmedSource.toLowerCase());

  const handleSaveSource = async () => {
    if (!canSaveSource) return;
    setSavingSource(true);
    try {
      const updated = await addSavedSource(trimmedSource);
      setSavedSources(updated);
      toast.success(`"${trimmedSource}" saved as a permanent source`);
    } catch (error) {
      console.error('Error saving source:', error);
      toast.error('Failed to save source');
    } finally {
      setSavingSource(false);
    }
  };

  const handleRemoveSavedSource = async (name: string) => {
    try {
      const updated = await removeSavedSource(name);
      setSavedSources(updated);
      toast.success(`Removed "${name}" from saved sources`);
    } catch (error) {
      console.error('Error removing saved source:', error);
      toast.error('Failed to remove saved source');
    }
  };

  const chipClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
      active
        ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600'
    }`;

  return (
    <div>
      <Label htmlFor={inputId}>Source</Label>
      <div className="flex gap-2 mt-1">
        <Input
          id={inputId}
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          placeholder="Official"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          disabled={!canSaveSource || savingSource}
          onClick={handleSaveSource}
          title="Save this source as a permanent chip"
        >
          {savingSource ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BookmarkPlus className="h-4 w-4" />
          )}
          Save chip
        </Button>
      </div>

      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2">Popular sources:</div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SOURCES.map((sourceItem) => (
            <button
              key={sourceItem.name}
              type="button"
              onClick={() => {
                onSourceChange(sourceItem.name);
                toast.success(`Source set to: ${sourceItem.name}`);
              }}
              className={chipClass(source === sourceItem.name)}
              title={`Set source to ${sourceItem.name}`}
            >
              <span>{sourceItem.icon}</span>
              <span>{sourceItem.name}</span>
            </button>
          ))}
        </div>
      </div>

      {(loadingSaved || customSavedSources.length > 0) && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-2">Your saved sources:</div>
          {loadingSaved ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading saved sources…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {customSavedSources.map((name) => (
                <div key={name} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      onSourceChange(name);
                      toast.success(`Source set to: ${name}`);
                    }}
                    className={`${chipClass(source === name)} rounded-r-none pr-2`}
                    title={`Set source to ${name}`}
                  >
                    <span>📝</span>
                    <span>{name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSavedSource(name)}
                    className="inline-flex items-center justify-center h-[30px] px-1.5 rounded-r-full border border-l-0 border-gray-200 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-gray-800 dark:border-gray-600"
                    title={`Remove "${name}" from saved sources`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showSameSourceCheckbox && onSameSourceChange && (
        <div className="flex items-center space-x-2 mt-3">
          <Checkbox
            id={`${inputId}-sameSource`}
            checked={sameSource}
            onCheckedChange={(checked) => onSameSourceChange(checked === true)}
          />
          <Label htmlFor={`${inputId}-sameSource`} className="text-sm text-gray-600">
            Same source in all wallpapers
          </Label>
        </div>
      )}
    </div>
  );
};

export default SourceSelector;

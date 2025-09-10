
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Category, getSubcategories } from '@/lib/firebase';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryType: 'main' | 'brand', categoryName: string) => void;
  onRemoveCategory: (category: string) => void;
  onAddCategoryClick: () => void;
  getSelectedMainCategory: () => string;
  getSelectedBrandCategory: () => string;
  onSubCategoryChange?: (subCategory: string) => void;
  selectedSubCategory?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategories,
  onCategoryChange,
  onRemoveCategory,
  onAddCategoryClick,
  getSelectedMainCategory,
  getSelectedBrandCategory,
  onSubCategoryChange,
  selectedSubCategory = ""
}) => {
  const mainCategories = categories.filter(cat => cat.categoryType === 'main');
  const brandCategories = categories.filter(cat => cat.categoryType === 'brand');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const selectedMainCategory = getSelectedMainCategory();
  
  // Fetch subcategories when main category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedMainCategory) {
        try {
          const subs = await getSubcategories(selectedMainCategory);
          setSubcategories(subs);
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          setSubcategories([]);
        }
      } else {
        setSubcategories([]);
      }
    };
    
    fetchSubcategories();
  }, [selectedMainCategory]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Categories</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          className="h-8 flex items-center gap-1 text-xs"
          onClick={onAddCategoryClick}
        >
          <PlusCircle className="h-3 w-3" />
          Add Category
        </Button>
      </div>
      
      {/* Show selected categories */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedCategories.map(cat => (
            <div 
              key={cat} 
              className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-1"
            >
              {cat}
              <button 
                type="button" 
                onClick={() => onRemoveCategory(cat)}
                className="text-primary/70 hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Main Categories */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium mb-2 text-gray-500">Main Categories</h4>
        <RadioGroup
          value={getSelectedMainCategory()}
          onValueChange={(value) => onCategoryChange('main', value)}
          className="flex flex-wrap gap-3"
        >
          {mainCategories.map(category => (
            <div key={category.categoryName} className="flex items-center space-x-2">
              <RadioGroupItem
                value={category.categoryName}
                id={`main-category-${category.categoryName}`}
              />
              <Label htmlFor={`main-category-${category.categoryName}`}>{category.categoryName}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Subcategories - only show if a main category is selected and it has subcategories */}
      {selectedMainCategory && subcategories.length > 0 && (
        <div className="space-y-4 mt-6">
          <h4 className="text-sm font-medium mb-2 text-gray-500">Subcategories</h4>
          <RadioGroup
            value={selectedSubCategory}
            onValueChange={(value) => onSubCategoryChange && onSubCategoryChange(value)}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="None"
                id="subcategory-none"
              />
              <Label htmlFor="subcategory-none">None</Label>
            </div>
            
            {subcategories.map(subCategory => (
              <div key={subCategory} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={subCategory}
                  id={`subcategory-${subCategory}`}
                />
                <Label htmlFor={`subcategory-${subCategory}`}>{subCategory}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      
      {/* Brand Categories */}
      <div className="space-y-4 mt-6">
        <h4 className="text-sm font-medium mb-2 text-gray-500">Brand Categories</h4>
        <RadioGroup
          value={getSelectedBrandCategory()}
          onValueChange={(value) => onCategoryChange('brand', value)}
          className="flex flex-wrap gap-3"
        >
          {brandCategories.map(category => (
            <div key={category.categoryName} className="flex items-center space-x-2">
              <RadioGroupItem
                value={category.categoryName}
                id={`brand-category-${category.categoryName}`}
              />
              <Label htmlFor={`brand-category-${category.categoryName}`}>{category.categoryName}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default CategorySelector;

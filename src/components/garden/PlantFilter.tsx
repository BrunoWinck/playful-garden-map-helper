
import React from "react";

interface PlantFilterProps {
  categoryFilter: string | null;
  setCategoryFilter: (category: string | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const PlantFilter = ({ 
  categoryFilter, 
  setCategoryFilter, 
  searchTerm, 
  setSearchTerm 
}: PlantFilterProps) => {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button 
          onClick={() => setCategoryFilter(null)} 
          className={`px-3 py-1 rounded-full text-sm ${!categoryFilter ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
        >
          All
        </button>
        <button 
          onClick={() => setCategoryFilter('vegetable')} 
          className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'vegetable' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
        >
          Vegetables
        </button>
        <button 
          onClick={() => setCategoryFilter('fruit')} 
          className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'fruit' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
        >
          Fruits
        </button>
        <button 
          onClick={() => setCategoryFilter('herb')} 
          className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'herb' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
        >
          Herbs
        </button>
        <button 
          onClick={() => setCategoryFilter('flower')} 
          className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'flower' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
        >
          Flowers
        </button>
        <button 
          onClick={() => setCategoryFilter('tree')} 
          className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'tree' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
        >
          Trees
        </button>
        <button 
          onClick={() => setCategoryFilter('shrub')} 
          className={`px-3 py-1 rounded-full text-sm ${categoryFilter === 'shrub' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
        >
          Shrubs
        </button>
      </div>
      
      <input
        type="text"
        placeholder="Search plants..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded-md"
      />
    </>
  );
};

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 bg-white mt-8">
      <div className="flex items-center text-sm text-gray-600 mb-4 sm:mb-0">
        <div className="relative mr-4">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1); // Reset to page 1 when changing items per page
            }}
            className="appearance-none bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-shnoor-indigo focus:border-shnoor-indigo cursor-pointer text-shnoor-navy font-medium"
          >
            {[6, 9, 12, 15, 18, 21, 24, 27, 30].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-shnoor-indigoMedium">
            <ChevronDown size={14} />
          </div>
        </div>
        <span className="font-medium text-shnoor-navy">{startItem}-{endItem}</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1 rounded-md text-shnoor-indigo hover:bg-shnoor-lavender disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
          title="First Page"
        >
          <ChevronsLeft size={20} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded-md text-shnoor-indigo hover:bg-shnoor-lavender disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
          title="Previous Page"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center space-x-2 text-sm ml-2 mr-2">
          <span className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md text-shnoor-navy font-medium bg-white">
            {currentPage}
          </span>
          <span className="text-gray-500">of {totalPages || 1}</span>
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 rounded-md text-shnoor-indigo hover:bg-shnoor-lavender disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
          title="Next Page"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 rounded-md text-shnoor-indigo hover:bg-shnoor-lavender disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
          title="Last Page"
        >
          <ChevronsRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

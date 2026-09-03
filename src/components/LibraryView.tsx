import React, { useState, useMemo } from 'react';
import { MediaItem } from '../types';
import {
  Film,
  Camera,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  Trash2,
  Share2,
  Edit2,
  Info,
  Play,
  Scissors,
  Download,
  Clock,
  HardDrive,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { formatBytes, formatDuration } from '../utils/constants';

interface LibraryViewProps {
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onRename: (item: MediaItem, newName: string) => void;
  onShare: (item: MediaItem) => void;
}

type FilterTab = 'all' | 'video' | 'screenshot';
type SortOption = 'newest' | 'oldest' | 'largest' | 'smallest';

export const LibraryView: React.FC<LibraryViewProps> = ({
  items,
  onPlay,
  onEdit,
  onDelete,
  onDeleteMultiple,
  onRename,
  onShare,
}) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [renameItem, setRenameItem] = useState<MediaItem | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [detailsItem, setDetailsItem] = useState<MediaItem | null>(null);
  const [deleteConfirmItems, setDeleteConfirmItems] = useState<MediaItem[] | null>(null);

  // Filter & Sort Pipeline
  const filteredItems = useMemo(() => {
    let result = items;
    if (filterTab !== 'all') {
      result = result.filter((i) => i.type === filterTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) => i.filename.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'largest') return b.fileSize - a.fileSize;
      if (sortBy === 'smallest') return a.fileSize - b.fileSize;
      return 0;
    });
  }, [items, filterTab, searchQuery, sortBy]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleExecuteRename = () => {
    if (!renameItem || !renameInput.trim()) return;
    onRename(renameItem, renameInput.trim());
    setRenameItem(null);
  };

  return (
    <div id="screenpro-library" className="w-full flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] text-[#E0E0E0]">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-[#1A1A1A] bg-[#0F0F0F] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 p-1 bg-[#161616] rounded-xl border border-[#252525]">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'all'
                  ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('video')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'video'
                  ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Videos ({items.filter((i) => i.type === 'video').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('screenshot')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTab === 'screenshot'
                  ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Screenshots ({items.filter((i) => i.type === 'screenshot').length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsMultiSelect(!isMultiSelect);
                setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isMultiSelect
                  ? 'bg-[#FF4B2B]/20 border-[#FF4B2B] text-[#FF4B2B]'
                  : 'bg-[#1A1A1A] border-[#333] text-[#999] hover:bg-[#252525] hover:text-white'
              }`}
            >
              {isMultiSelect ? 'Done' : 'Select'}
            </button>
          </div>
        </div>

        {/* Search Input & Sort Selector */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recordings..."
              className="w-full bg-[#161616] border border-[#252525] rounded-xl pl-9 pr-4 py-2 text-xs text-[#E0E0E0] placeholder-[#666] outline-none focus:border-[#FF4B2B] transition-colors"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#161616] border border-[#252525] rounded-xl px-3 py-2 text-xs text-[#999] outline-none focus:border-[#FF4B2B]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="largest">Largest File</option>
            <option value="smallest">Smallest File</option>
          </select>
        </div>

        {/* Multi-Select Action Bar */}
        {isMultiSelect && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FF4B2B]/10 border border-[#FF4B2B]/30 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center space-x-1.5 text-[#FF4B2B] font-medium"
            >
              {selectedIds.length === filteredItems.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedIds.length === filteredItems.length ? 'Deselect All' : 'Select All'} ({selectedIds.length})
              </span>
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const toDelete = items.filter((i) => selectedIds.includes(i.id));
                  setDeleteConfirmItems(toDelete);
                }}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid List of Recordings */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#666]">
            <Film className="w-12 h-12 text-[#444] mb-3" />
            <h3 className="font-semibold text-[#888] text-sm">No recordings found</h3>
            <p className="text-xs text-[#555] mt-1 max-w-xs">
              Start your first screen recording from the Home tab to build your library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isMultiSelect) {
                      toggleSelect(item.id);
                    } else if (item.type === 'video') {
                      onPlay(item);
                    }
                  }}
                  className={`group relative flex flex-col bg-[#161616] hover:bg-[#1A1A1A] border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-[#FF4B2B] ring-2 ring-[#FF4B2B]/40'
                      : 'border-[#252525] hover:border-[#333]'
                  }`}
                >
                  {/* Thumbnail Banner */}
                  <div className="relative w-full aspect-video bg-[#0A0A0A] flex items-center justify-center overflow-hidden border-b border-[#222]">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : item.type === 'screenshot' && item.url ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-[#555]">
                        <Film className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">Preview</span>
                      </div>
                    )}

                    {/* Duration Badge for Videos */}
                    {item.type === 'video' && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-mono text-white flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#FF4B2B]" />
                        <span>{formatDuration(item.duration)}</span>
                      </div>
                    )}

                    {/* Screenshot Badge */}
                    {item.type === 'screenshot' && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-[#1A1A1A]/90 text-[10px] font-medium text-[#999] border border-[#333]">
                        Screenshot
                      </div>
                    )}

                    {/* Multi-select checkmark indicator */}
                    {isMultiSelect && (
                      <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-[#FF4B2B]">
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-white/70" />}
                      </div>
                    )}

                    {/* Play Hover Overlay for single click */}
                    {!isMultiSelect && item.type === 'video' && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-3 rounded-full bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-white truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#666] font-mono truncate mt-0.5" title={item.filename}>
                        {item.filename}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#222] flex items-center justify-between text-[11px] text-[#666]">
                      <div className="flex items-center space-x-2">
                        <span>{formatBytes(item.fileSize)}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Quick item actions */}
                      {!isMultiSelect && (
                        <div
                          className="flex items-center space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.type === 'video' && (
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="p-1 text-[#666] hover:text-[#FF4B2B] rounded hover:bg-[#222] transition-colors"
                              title="Edit recording"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onShare(item)}
                            className="p-1 text-[#666] hover:text-[#FF4B2B] rounded hover:bg-[#222] transition-colors"
                            title="Share"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRenameItem(item);
                              setRenameInput(item.title);
                            }}
                            className="p-1 text-[#666] hover:text-amber-400 rounded hover:bg-[#222] transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailsItem(item)}
                            className="p-1 text-[#666] hover:text-white rounded hover:bg-[#222] transition-colors"
                            title="Details"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmItems([item])}
                            className="p-1 text-[#666] hover:text-red-400 rounded hover:bg-[#222] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      {renameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111] border border-[#222] rounded-3xl p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2">Rename Recording</h3>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF4B2B] mb-4"
              placeholder="Recording title"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRenameItem(null)}
                className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] text-[#999] text-xs hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRename}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold text-xs hover:brightness-110 shadow-md shadow-[#FF4B2B33] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      {detailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recording Details</h3>
              <button
                type="button"
                onClick={() => setDetailsItem(null)}
                className="p-1 text-[#666] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#222]">
                <span className="text-[#666]">File Name:</span>
                <span className="text-[#E0E0E0] font-mono">{detailsItem.filename}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222]">
                <span className="text-[#666]">File Size:</span>
                <span className="text-[#E0E0E0]">{formatBytes(detailsItem.fileSize)}</span>
              </div>
              {detailsItem.type === 'video' && (
                <div className="flex justify-between py-1 border-b border-[#222]">
                  <span className="text-[#666]">Duration:</span>
                  <span className="text-[#E0E0E0]">{formatDuration(detailsItem.duration)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-[#222]">
                <span className="text-[#666]">MIME Type:</span>
                <span className="text-[#E0E0E0] font-mono">{detailsItem.mimeType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222]">
                <span className="text-[#666]">Recorded At:</span>
                <span className="text-[#E0E0E0]">{new Date(detailsItem.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#222]">
                <span className="text-[#666]">Storage URI:</span>
                <span className="text-[#E0E0E0] font-mono">
                  {detailsItem.type === 'video' ? 'Movies/ScreenPro/' : 'Pictures/ScreenPro/'}
                  {detailsItem.filename}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailsItem(null)}
                className="px-4 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] text-[#999] text-xs hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111] border border-[#222] rounded-3xl p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-1">
              Delete {deleteConfirmItems.length === 1 ? 'this recording' : `${deleteConfirmItems.length} recordings`}?
            </h3>
            <p className="text-xs text-[#888] mb-4">
              This action will remove the selected files permanently from local storage.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItems(null)}
                className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] text-[#999] text-xs hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmItems.length === 1) {
                    onDelete(deleteConfirmItems[0]);
                  } else {
                    onDeleteMultiple(deleteConfirmItems.map((i) => i.id));
                  }
                  setDeleteConfirmItems(null);
                  setSelectedIds([]);
                  setIsMultiSelect(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-500 shadow-md shadow-red-600/30 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { getImageUrl } from '../data/imageMapping';

const RichChatMessage = ({ content, isBot = true }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImage, setModalImage] = useState(null);

    // Regex to find [Image: KeyName]
    // 1st Group: Text before tag
    // 2nd Group: The Tag Key
    // 3rd Group: Text after tag (handled by loop if multiple)
    const renderContent = () => {
        if (!content) return null;

        const parts = [];
        let lastIndex = 0;
        const regex = /\[Image:\s*([a-zA-Z0-9_]+)\]/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            // Push text before the match
            if (match.index > lastIndex) {
                parts.push(
                    <span key={`text-${lastIndex}`}>
                        {content.substring(lastIndex, match.index)}
                    </span>
                );
            }

            // Extract Key and Get Image
            const key = match[1];
            const imageUrl = getImageUrl(key);

            if (imageUrl) {
                parts.push(
                    <div
                        key={`img-${match.index}`}
                        className="mt-3 mb-3 group cursor-pointer relative overflow-hidden rounded-md border border-gray-100 shadow-sm hover:shadow-md transition-all"
                        onClick={() => openModal(imageUrl)}
                    >
                        <img
                            src={imageUrl}
                            alt={key}
                            className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 h-8 w-8 drop-shadow-md transform scale-75 group-hover:scale-100 transition-all" />
                        </div>
                    </div>
                );
            } else {
                // Fallback for missing images
                parts.push(
                    <div key={`err-${match.index}`} className="text-xs text-red-400 italic mt-1">
                        (Image unavailable: {key})
                    </div>
                );
            }

            lastIndex = regex.lastIndex;
        }

        // Push remaining text
        if (lastIndex < content.length) {
            parts.push(
                <span key={`text-end`}>
                    {content.substring(lastIndex)}
                </span>
            );
        }

        return parts;
    };

    const openModal = (url) => {
        setModalImage(url);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalImage(null);
    };

    return (
        <div className={`p-0 ${isBot ? '' : ''}`}>
            {/* 1. Chat Content */}
            <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {renderContent()}
            </div>

            {/* 2. Lightbox Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal}>
                    <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={closeModal}
                            className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={modalImage}
                            alt="Full View"
                            className="w-full h-full max-h-[85vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default RichChatMessage;

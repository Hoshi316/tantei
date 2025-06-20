// src/components/SettingsModal.tsx
'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type BgmOption = 'none' | 'bgm-A' | 'bgm-B';

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [selectedBgm, setSelectedBgm] = useState<BgmOption>('none');

  useEffect(() => {
    // localStorageから設定を読み込む
    const savedBgmSetting = localStorage.getItem('selectedBgm');
    if (savedBgmSetting) {
      setSelectedBgm(savedBgmSetting as BgmOption);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedBgm', selectedBgm);

  }, [selectedBgm]); 

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full relative shadow-lg">
        <h2 className="text-xl font-bold mb-4">⚙️ 設定</h2>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
          onClick={onClose}
        >
          ×
        </button>

        <div className="mb-4">
          <h3 className="text-gray-700 font-semibold mb-2">背景音楽</h3>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="bgm-option"
                value="none"
                checked={selectedBgm === 'none'}
                onChange={() => setSelectedBgm('none')}
                className="form-radio"
              />
              <span>無音</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="bgm-option"
                value="bgm-A"
                checked={selectedBgm === 'bgm-A'}
                onChange={() => setSelectedBgm('bgm-A')}
                className="form-radio"
              />
              <span>BGM A (ミステリアス)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="bgm-option"
                value="bgm-B"
                checked={selectedBgm === 'bgm-B'}
                onChange={() => setSelectedBgm('bgm-B')}
                className="form-radio"
              />
              <span>BGM B (軽快)</span>
            </label>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
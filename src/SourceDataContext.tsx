// SourceDataContext.tsx
import React, {createContext, ReactNode, useContext, useState} from 'react';
import MYDATA from "./products_export.json";


export interface SourceData {
  source_id: number;
}

interface SourceDataContextType {
  sourceData: SourceData[];
  setSourceData: React.Dispatch<React.SetStateAction<SourceData[]>>;

  selectedSourceId: number | null;
  setSelectedSourceId: React.Dispatch<React.SetStateAction<number | null>>;

  allMatches: number[];
  setMatches: React.Dispatch<React.SetStateAction<number[]>>;

  setMaxLength: React.Dispatch<React.SetStateAction<number>>;
  maxStrLength: number;

}

const SourceDataContext = createContext<SourceDataContextType | undefined>(undefined);

export const useSourceData = () => {
  const context = useContext(SourceDataContext);
  if (!context) {
    throw new Error('useSourceData must be used within a SourceDataProvider');
  }
  return context;
};

interface SourceDataProviderProps {
  children: ReactNode;
}

export const SourceDataProvider: React.FC<SourceDataProviderProps> = ({ children }) => {
  const [sourceData, setSourceData] = useState<SourceData[]>(MYDATA);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [allMatches, setMatches] = useState<number[]>([]);
  const [maxStrLength, setMaxLength] = useState<number>(100);

  return (
    <SourceDataContext.Provider value={{ sourceData, setSourceData, selectedSourceId, setSelectedSourceId, allMatches, setMatches, maxStrLength, setMaxLength }}>
      {children}
    </SourceDataContext.Provider>
  );
};

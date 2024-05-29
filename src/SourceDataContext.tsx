// SourceDataContext.tsx
import React, {createContext, ReactNode, useEffect, useContext, useState} from 'react';
// import MYDATA from "./music-catalogue.json";
// const MYDATA = require('./' + process.env.REACT_APP_DATASET_PATH).default


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

export const SourceDataProvider: React.FC<SourceDataProviderProps> = ({children}) => {
    const [sourceData, setSourceData] = useState<SourceData[]>([]);
    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [allMatches, setMatches] = useState<number[]>([]);
    const [maxStrLength, setMaxLength] = useState<number>(100);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/'+process.env.REACT_APP_DATASET_PATH?.replace("public/", ""));
            const jsonData = await response.json();
            setSourceData(jsonData);
        };
        fetchData();
    }, []);


    return (
        <SourceDataContext.Provider value={{
            sourceData,
            setSourceData,
            selectedSourceId,
            setSelectedSourceId,
            allMatches,
            setMatches,
            maxStrLength,
            setMaxLength
        }}>
            {children}
        </SourceDataContext.Provider>
    );
};

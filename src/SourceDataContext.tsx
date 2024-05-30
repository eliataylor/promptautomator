import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';

interface Config {
    model: string;
    executable: string;
    file_path: string;
    assistant: boolean | string;
    file_search: boolean | string;
    vector_store: boolean | string;
    code_interpreter: boolean | string;
    fine_tuning?: string;
    file_id?: string;
    thread_id?: string;
    assistant_id?: string;
    vector_store_id?: string;
}

export interface ResultData {
    filename: string;
    runkey: string;
    prompt_id?: string | number;
    ms: number;
    started: string;
    ended: string;
    model: string;
    prompt: string;
    survey_id: string;
    response: string;
    instructions: string;
    config: Config;
    results: object | null;
}

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

    setResults: React.Dispatch<React.SetStateAction<ResultData[] | null>>;
    results: ResultData[] | null;

    promptId: string;
    setPromptId: React.Dispatch<React.SetStateAction<string>>;


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
    const [results, setResults] = useState<ResultData[] | null>(null);
    const [promptId, setPromptId] = React.useState('all');


    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/' + process.env.REACT_APP_DATASET_PATH?.replace("public/", ""));
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
            setMaxLength,
            results, setResults, setPromptId, promptId
        }}>
            {children}
        </SourceDataContext.Provider>
    );
};

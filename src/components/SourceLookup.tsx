// SourceLookup.tsx
import React, {ReactNode, useEffect} from 'react';
import {Button} from "@mui/material";
import {FindInPage} from "@mui/icons-material";
import {useSourceData} from '../SourceDataContext';

interface SourceLookupProps {
    children: ReactNode;
    source_id: number;
}

const SourceLookup: React.FC<SourceLookupProps> = ({children, source_id}) => {
    const {sourceData, selectedSourceId, setSelectedSourceId, allMatches, setMatches} = useSourceData();

    useEffect(() => {
        if (!allMatches.includes(source_id)) {
            allMatches.push(source_id)
            setMatches(allMatches)
        }
    }, [source_id]);

    const handleFilter = () => {
        if (selectedSourceId === source_id) {
            setSelectedSourceId(null);
        } else {
            setSelectedSourceId(source_id);
        }

    };

    return <Button fullWidth={true} onClick={handleFilter} size={'small'}
                   startIcon={<FindInPage fontSize={'small'}/>}>{children}</Button>
};

export default SourceLookup;

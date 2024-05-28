import React, {useEffect, useState} from 'react';
import {Theme} from "@mui/material";
import {useTheme} from '@mui/material/styles';
import DataTable from "./components/DataTable";
import {schema} from "./schema";

const FIELDSCHEMA = schema();

const Home: React.FC = () => {
    // const theme = useTheme() as Theme;
    const theme = useTheme<Theme>();
    const [results, setResults] = useState<[] | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/results.json');
                if (!response.ok) {
                    throw new Error('Failed to fetch menu data');
                }
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error('Error fetching menu data:', error);
                window.alert('Error loading Menu')
            }
        };

        fetchData();
    }, []);

    if (!results || !Array.isArray(results)) return <div>loading menu...</div>
    if (results.length === 0) return <div>no results</div>

    return (
             <DataTable
                rows={results}
                searchTools={true}
                title={'OpenAI Results'}
                columns={FIELDSCHEMA}
            />
    );
};

export default Home;

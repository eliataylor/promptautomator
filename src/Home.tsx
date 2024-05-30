import React from 'react';
import DataTable from "./components/DataTable";
import {schema} from "./schema";
import {useSourceData} from "./SourceDataContext";

const FIELDSCHEMA = schema();

const Home: React.FC = () => {
    const {results, promptId} = useSourceData();

    if (!results || !Array.isArray(results)) return <div>loading menu...</div>
    if (results.length === 0) return <div>no results</div>

    return (
             <DataTable
                rows={results}
                prompt_id={promptId}
                searchTools={true}
                title={'OpenAI Results'}
                columns={FIELDSCHEMA}
            />
    );
};

export default Home;

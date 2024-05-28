import fields from "./schema.json";
import React from 'react';
import ReadMoreText from "./components/ReadMoreText";
import SourceLookup from "./components/SourceLookup";
import {findNumericalIds, renderArray, renderObject} from "./utils";

export const schema = () => {

    fields.ms.renderCell = (params) => {
        return params.value.toFixed(2)
    }

    fields.prompt.renderCell = (params) => {
        return <ReadMoreText text={params.value} maxLength={100}/>
    }

    fields.instructions.renderCell = (params) => {
        return <ReadMoreText text={params.value} maxLength={100}/>
    }

    fields.started.renderCell = (params) => {
        const date = new Date(params.value);
        const options = {year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'};
        return date.toLocaleDateString('en-US', options);
    }

    fields.ended.renderCell = (params) => {
        const date = new Date(params.value);
        const options = {year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'};
        return date.toLocaleDateString('en-US', options);
    }

    fields.config.renderCell = (params) => {
        delete params.value.model;
        for(let p in params.value) {
            if (!params.value[p] || params.value[p].toString().toUpperCase() === "FALSE") {
                delete params.value[p];
            }
        }
        return renderObject(params.value)

    }

    fields.results.renderCell = (params) => {
        let lookups = []
        let str = params.value

        if (typeof params.value === 'string') {
            lookups = findNumericalIds(str)
        }

        lookups = [...new Set(lookups)]

        return <React.Fragment>
            {lookups.length > 0 && lookups.map(id => {
                return <SourceLookup source_id={id}
                                     key={`lookup-${id}-result_item`}>{id}</SourceLookup>
            })}

            {(typeof params.value === 'object') ?
                renderArray(params.value) :
                <ReadMoreText text={str} maxLength={100}/>
            }
        </React.Fragment>
    }

    return Object.values(fields);
};

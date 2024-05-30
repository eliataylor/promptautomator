import {Divider, Typography} from "@mui/material";
import {CheckCircleOutlined, Close} from "@mui/icons-material";
import React from "react";
import SourceLookup from "./components/SourceLookup";

export const SOURCE_KEYS = ['product_id', 'Product ID', 'source_id', 'Source ID', 'Product ID\\*\\*\\:'];

export function getParam(name: string, url: string = document.location.search, d: any): string | string[] {
    if (!d && typeof d !== 'number') d = '';

    if (url.indexOf('?') > -1) {
        url = url.slice(url.indexOf('?') + 1);
    }

    const parts = url.split('&');
    const vals: string[] = [];

    parts.forEach((e) => {
        const param = e.split('=');
        if (param[0] === name) {
            vals.push(param[1]);
        }
    });

    if (vals.length === 0) {
        return d;
    }

    if (vals.length === 1) {
        return vals[0];
    }

    return vals;
}

export function findSourceId(item: object): number | boolean {
    for (let key in item) {
        if (SOURCE_KEYS.includes(key)) {
            // @ts-ignore
            return item[key]
        }
    }
    return false
}


export function findNumericalIds(input: string): number[] {
    const regex = new RegExp(`(?:${SOURCE_KEYS.join('|')})\\s*\\s*(\\d+)`, 'gi');

    const matches: number[] = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
        matches.push(parseInt(match[1], 10));
    }
    return matches;
}

export function renderArray(obj: []) {
    if (!obj) return null;
    return obj.map((value, i) => {
        return <React.Fragment>
            {renderObject(value)}
            {i < obj.length - 1 && <Divider sx={{margin: 1}}/>}
        </React.Fragment>
    })
}

export function renderObject(obj: object) {
    let id = findSourceId(obj)
    return <ul style={{margin: 0, padding: 0, listStyle: 'none', verticalAlign: 'middle'}}>
        {Object.entries(obj).map(([key, value]) => {

            const bool = value.toString().toUpperCase()

            if (key === 'exists') {
                if (value === true) return null;
                return <Typography variant={'caption'}
                                   sx={{display: 'flex', gap: '3px', alignContent: 'center', alignItems: 'center', color: 'red'}}>
                    <span>{key} </span>
                    <span>
                    {value === true ? <CheckCircleOutlined fontSize={'small'}/> : <Close fontSize={'small'}/>}
                    </span>
                </Typography>
            }

            return <div key={key}>
                {typeof id === 'number' && SOURCE_KEYS.includes(key) ?
                    <SourceLookup source_id={id}>{id}</SourceLookup>
                    :

                    bool === 'TRUE' || bool === 'FALSE' ?
                        <Typography variant={'caption'}
                                    sx={{display: 'flex', gap: '3px', alignContent: 'center', alignItems: 'center'}}>
                            <span>{key} </span>
                            <span>
                                {bool === 'TRUE' ? <CheckCircleOutlined fontSize={'small'}/> :
                                    <Close color={'error'} fontSize={'small'}/>}</span>
                        </Typography> :
                        <div>
                            <Typography variant={'caption'}>{key}: </Typography>
                            <Typography variant={'body2'} sx={{display: 'inline'}}>{value.toString()}</Typography>
                        </div>
                }
            </div>
        })}
    </ul>
}

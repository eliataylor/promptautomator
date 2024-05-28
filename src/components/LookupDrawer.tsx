// LookupDrawer.tsx
import React from 'react';
import {Box, Drawer, List, MenuItem, TextField, Typography} from '@mui/material';
import {useSourceData} from '../SourceDataContext';
import {findSourceId, renderObject} from "../utils";

const drawerWidth = 300

const LookupDrawer: React.FC = () => {
    const {selectedSourceId, setSelectedSourceId, allMatches, sourceData} = useSourceData();

    function getSourceEntry(id: number | null) {
        if (!id) return null;
        for (let i in sourceData) {
            var isId = findSourceId(sourceData[i])
            if (isId && id == isId) {
                return sourceData[i]
            }
        }
        return null
    }

    const selectedSource = getSourceEntry(selectedSourceId);


    // @ts-ignore
    return (
        <Drawer variant="persistent" anchor="left" open={!!selectedSourceId}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}>
            <Box sx={{padding: 1}}>
                <TextField
                    select
                    label={'Selected Match'}
                    variant={'filled'}
                    fullWidth={true}
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(parseInt(e.target.value))}
                >
                    {allMatches.map(source_id => {
                        return <MenuItem key={source_id} value={source_id}>
                            {source_id}
                        </MenuItem>
                    })}
                </TextField>
                <List>
                    {selectedSource ? renderObject(selectedSource) :
                        <Typography variant={'body1'}>No source selected</Typography>
                    }
                </List>
            </Box>
        </Drawer>
    )
        ;
};

export default LookupDrawer;

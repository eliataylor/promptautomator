import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {List, ListItem, Box, ListItemText, TextField, Divider} from '@mui/material';
import {useSourceData} from "../SourceDataContext";
import ThemeSwitcher from "../theme/ThemeSwitcher";

const DrawerMenu = () => {
    const location = useLocation();
    const {setMaxLength, maxStrLength} = useSourceData();
    return (
        <Box sx={{padding: 1}}>
            <TextField
                label={'Max String Length'}
                variant={"filled"}
                type={'number'}
                fullWidth={true}
                sx={{margin:1}}
                value={maxStrLength}
                onChange={(e) => setMaxLength(parseInt(e.target.value))}
            />

            <ThemeSwitcher/>

            <Divider sx={{margin:1}} />
            <List>
                <ListItem button component={Link} target={"_blank"} to="https://platform.openai.com">
                    <ListItemText primary="OpenAI Platform "/>
                </ListItem>
                <ListItem button component={Link} target={"_blank"} to="https://platform.openai.com/docs/api-reference">
                    <ListItemText primary="OpenAI API Docs "/>
                </ListItem>

            </List>
        </Box>
    );
};

export default DrawerMenu;

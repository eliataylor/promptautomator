// ThemeContext.js
import React, {createContext, useMemo, useState} from 'react';
import {createTheme, ThemeProvider as MuiThemeProvider} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {green, orange} from '@mui/material/colors';

import GlobalStyles from './GlobalStyles'; // Import the global styles
const ThemeContext = createContext();

const ThemeProvider = ({children}) => {
    const [darkMode, setDarkMode] = useState(true);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: darkMode ? 'dark' : 'light',
                    warning: {
                        main: orange[500],
                    },
                    success: {
                        main: green[500],
                    },
                    link: {
                        main: '#47a21e'
                    },
                },
            }),
        [darkMode]
    );

    return (
        <ThemeContext.Provider value={{darkMode, setDarkMode}}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline/>
                <GlobalStyles />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};

export {ThemeProvider, ThemeContext};

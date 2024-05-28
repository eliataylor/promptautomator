import React from 'react';
import {ThemeProvider} from './theme/ThemeContext';
import Router from "./Router";
import {SourceDataProvider} from "./SourceDataContext";

function App() {
    return (
        <ThemeProvider>
            <SourceDataProvider>
                <Router/>
            </SourceDataProvider>
        </ThemeProvider>
    );
}

export default App;

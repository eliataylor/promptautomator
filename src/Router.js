import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Home from './Home';
import Layout from "./theme/Layout";


const Router = () => {

    return (
        <BrowserRouter>
            <Layout>

                    <Routes>
                        <Route path="/" element={<Home/>}/>
                        <Route path="*" element={<div>Page not found</div>}/>
                    </Routes>
            </Layout>
        </BrowserRouter>
    );
};

export default Router;

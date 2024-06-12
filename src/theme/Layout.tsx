import React, {useEffect} from 'react';
import {AppBar, Box, Grid, MenuItem, TextField} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DrawerMenu from "../components/DrawerMenu";
import LookupDrawer from "../components/LookupDrawer";
import {styled} from "@mui/material/styles";
import {useSourceData} from "../SourceDataContext";

const DrawerHeader = styled('div')(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, .2, 0, 1),
    justifyContent: 'space-between',
}));

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({children}) => {
    const {selectedSourceId, setResults, promptId, setPromptId} = useSourceData();
    const [open, setOpen] = React.useState(false);
    const [allPromptIds, setAllPromptIds] = React.useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/${process.env.REACT_APP_RESULTS_INDEX}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch menu data');
                }
                const data = await response.json();

                let ids = {};
                data.forEach((r: any) => {
                    if (typeof r.prompt_id !== 'undefined') {
                        // @ts-ignore
                        ids[r.prompt_id] = true
                    }
                })
                setResults(data)
                // @ts-ignore
                setAllPromptIds(Object.keys(ids))

            } catch (error) {
                console.error('Error fetching menu data:', error);
                window.alert('Error loading Menu')
            }
        }
        fetchData();
    }, []);


    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    const handleIdChange = (id: any) => {
        setPromptId(id);
    };

    return (
        <Box sx={{display: 'flex'}}>
            <Grid container>

                <Grid item>
                    <LookupDrawer/>
                </Grid>
                <Grid item
                      style={{width: selectedSourceId && window.innerWidth > 600 ? window.innerWidth - 300 : '100%'}}>
                    <AppBar position="sticky" color={'transparent'}>
                        <Grid container justifyContent={'space-between'} alignItems={'center'} padding={1} spacing={2}>
                            <Grid item>
                                <TextField
                                    select
                                    size={'small'}
                                    variant={'filled'}
                                    value={promptId}
                                    label={'Select Prompt ID'}
                                    onChange={(e) => handleIdChange(e.target.value)}
                                >
                                    <MenuItem value='all'>All Prompt IDs</MenuItem>
                                    {/* <MenuItem value={'0'}>Missing Prompt IDs</MenuItem> */}
                                    {allPromptIds.map((id: any) => <MenuItem value={id}>{id}</MenuItem>)}
                                </TextField>
                            </Grid>

                            <Grid item>
                                <IconButton
                                    size={'large'}
                                    aria-label="open drawer"
                                    onClick={handleDrawerOpen}
                                >
                                    <MenuIcon/>
                                </IconButton>
                            </Grid>
                        </Grid>
                    </AppBar>
                    {children}
                </Grid>
            </Grid>
            <Drawer
                anchor="right"
                variant={"temporary"}
                open={open}
            >
                <DrawerHeader>
                    <IconButton onClick={handleDrawerClose}>
                        <ChevronRightIcon/>
                    </IconButton>
                </DrawerHeader>
                <DrawerMenu/>
            </Drawer>
        </Box>
    );
};

export default Layout;

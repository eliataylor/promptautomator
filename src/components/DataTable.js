import React, {useEffect, useState} from 'react';
import {
    AppBar,
    Checkbox,
    Divider,
    FormControlLabel,
    Grid,
    InputAdornment,
    LinearProgress,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Toolbar,
    Typography
} from '@mui/material';
import {styled} from '@mui/system';
import SearchIcon from '@mui/icons-material/Search';
import {getParam} from '../utils';
import {useLocation} from 'react-router-dom';
import MoreMenu from "./MoreMenu";

const StyledTableCell = styled(TableCell)(({theme}) => ({
    '& .hasIcon': {
        display: 'flex',
        alignItems: 'center',
        alignContent: 'center',
        '& img': {marginRight: 2}
    },
    '& .sortIcon': {
        position: 'absolute',
        left: 3,
        top: 23,
        transition: 'all .5s ease-out',
        transformOrigin: 'center center',
        width: 0,
        height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: `6px solid ${theme.palette.primary.main}`,
        marginLeft: 2,
    },
    '&[aria-sort="false"], &[aria-sort="asc"], &[aria-sort="desc"]': {
        cursor: 'pointer',
        paddingLeft: 18,
        position: 'relative'
    },
    '&[aria-sort="false"] .sortIcon': {
        transform: 'rotate(0deg)',
        borderLeft: `6px solid ${theme.palette.divider}`,
    },
    '&[aria-sort="desc"] .sortIcon': {
        transform: 'rotate(90deg)'
    },
    '&[aria-sort="asc"] .sortIcon': {
        transform: 'rotate(-90deg)'
    },
}));

const DataTable = (props) => {
    const location = useLocation();

    const [state, setState] = useState({
        rows: props.rows,
        pageNum: props.pageNum || 0,
        pageSize: props.pageSize || 250,
        searchTools: props.searchTools || true,
        searchCondition: getParam('condition', location.search, 'contains'),
        searchText: props.searchText || getParam('q', location.search, ''),
        searchFields: props.searchFields || props.columns.reduce((acc, obj) => {
            if (obj.filterable) acc[obj.field] = true;
            return acc;
        }, {}),

        showingFields: props.columns.reduce((acc, obj) => {
            acc[obj.field] = (typeof obj.showing === 'undefined' || obj.showing === true);
            return acc;
        }, {}),
    });

    useEffect(() => {
        searchData()
    }, [state.searchText, state.searchFields, state.searchCondition]);


    const compareStr = (a) => {
        if (!a) return false;
        let parts = state.searchText.split(' OR ');

        if (state.searchCondition === 'equals') {
            return parts.some(part => part.toLowerCase() === a.toString().toLowerCase());
        } else if (state.searchCondition === 'startswith') {
            return parts.some(part => a.toString().toLowerCase().startsWith(part.toLowerCase()));
        } else {
            return parts.some(part => a.toString().toLowerCase().includes(part.toLowerCase()));
        }
    };

    const searchData = (init) => {
        let filtered = props.rows;
        if (state.searchText.length > 0) {
            let valueGetters = {};
            props.columns.forEach(col => {
                if (typeof state.searchFields[col.field] !== 'undefined' && state.searchFields[col.field] === true) {
                    valueGetters[col.field] = typeof col.valueGetter === 'function' ? col.valueGetter : (params) => params.value;
                }
            });

            filtered = props.rows.filter((row) => {
                return Object.keys(valueGetters).some(filter => {
                    let val = valueGetters[filter]({value: row[filter], row: row});
                    return compareStr(val);
                });
            });
        }
        console.log(state.searchText, filtered)
        if (init) return filtered;
        setState((prevState) => {
            return {...prevState, rows: filtered}
        });
    };

    const handleConditionChange = (cond) => {
        setState((prevState) => ({...prevState, searchCondition: cond}));
    };

    const handleFiltering = (name) => {
        setState((prevState) => {
            const filters = {...prevState.searchFields, [name]: !prevState.searchFields[name]};
            return {...prevState, searchFields: filters};
        });
    };

    const handleShowing = (name) => {
        setState((prevState) => {
            const showing = {...prevState.showingFields, [name]: !prevState.showingFields[name]};
            return {...prevState, showingFields: showing};
        });
    };

    const handleSearchText = (val) => {
        setState((prevState) => ({...prevState, searchText: val}));
    };

    const handleChangePage = (event, newPage) => {
        setState((prevState) => ({...prevState, pageNum: newPage}));
    };

    const handleChangeRowsPerPage = (event) => {
        setState((prevState) => ({...prevState, pageSize: parseInt(event.target.value), pageNum: 0}));
    };

    const handleSort = (field) => {
        let rows = [...state.rows];
        let sorters = [];
        props.columns.forEach(col => {
            if (col.field === field) {
                col.sortDir = col.sortDir === -1 ? 0 : col.sortDir === 0 ? 1 : -1;
            }
            if (col.sortable === true && (col.sortDir === -1 || col.sortDir === 1)) {
                sorters.push(col);
            }
        });

        rows.sort((row1, row2) => {
            for (let col of sorters) {
                let a = col.valueGetter ? col.valueGetter({
                    row: row1,
                    value: row1[col.field],
                    forSorting: true
                }) : row1[col.field];
                let b = col.valueGetter ? col.valueGetter({
                    row: row2,
                    value: row2[col.field],
                    forSorting: true
                }) : row2[col.field];

                let compare = 0;
                if (typeof a === 'string') {
                    if (!b) b = '';
                    compare = col.sortDir === -1 ? b.localeCompare(a) : a.localeCompare(b);
                } else if (typeof a === 'number') {
                    if (!b) b = -1;
                    compare = col.sortDir === -1 ? b - a : a - b;
                } else if (typeof a === 'boolean') {
                    compare = col.sortDir === -1 ? (a === b ? 0 : a ? -1 : 1) : (a === b ? 0 : a ? 1 : -1);
                }
                if (compare !== 0) return compare;
            }
            return 0;
        });

        setState((prevState) => ({...prevState, rows}));
    };

    const startIndex = state.pageNum * state.pageSize;
    // if (!state.rows || Array.isArray(state.rows)) return null;
    const pageRows = state.rows.slice(startIndex, Math.min(startIndex + state.pageSize, state.rows.length));

    const filters = props.columns.reduce((acc, o) => {
        if (o.filterable) {
            acc.push(<FormControlLabel
                key={`filter-${o.field}`}
                size={'small'}
                fontSize={'small'}
                control={
                    <Checkbox
                        size={'small'}
                        fontSize={'small'}
                        checked={state.searchFields[o.field] === true}
                        onChange={(e) => handleFiltering(o.field)}
                        name={o.field}
                        color="primary"
                    />
                }
                label={o.headerName}
            />)
        }
        return acc;
    }, [])

    const showing = props.columns.map((o, i) => {
        return <FormControlLabel
            key={`showing-${o.field}`}
            size={'small'}
            fontSize={'small'}
            control={
                <Checkbox
                    size={'small'}
                    fontSize={'small'}
                    checked={state.showingFields[o.field] === true}
                    onChange={(e) => handleShowing(o.field)}
                    name={o.field}
                    color="primary"
                />
            }
            label={o.headerName}
        />
    })

    return (
        <div style={{position: 'relative'}}>
            {props.searchTools &&
                <AppBar position="sticky" color={'default'}>
                    <Toolbar style={{padding: '0 8px'}}>
                        <Grid container justify="space-between" spacing={1} alignContent="center" alignItems="flex-end">
                            <Grid item>
                                <TextField
                                    select
                                    size={'small'}
                                    variant={'standard'}
                                    value={state.searchCondition}
                                    onChange={(e) => handleConditionChange(e.target.value)}
                                >
                                    <MenuItem value="contains">Contains</MenuItem>
                                    <MenuItem value="equals">Equals</MenuItem>
                                    <MenuItem value="startswith">Starts with</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item style={{flexGrow: 1}}>
                                <TextField
                                    value={state.searchText}
                                    onChange={(e) => handleSearchText(e.currentTarget.value)}
                                    placeholder="Search..."
                                    variant="standard"
                                    autoFocus
                                    fullWidth
                                    inputProps={{'aria-label': 'Search data table'}}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item>
                                <MoreMenu>
                                    <Typography variant={'overline'}>Columns To Search</Typography>
                                    <div>{filters}</div>
                                    <Divider sx={2} />
                                    <Typography variant={'overline'}>Columns To Show</Typography>
                                    <div>{showing}</div>
                                </MoreMenu>
                            </Grid>
                        </Grid>
                    </Toolbar>

                    {state.pageSize < state.rows.length ?
                        <Toolbar>
                            <TablePagination
                                style={{width: '100%'}}
                                rowsPerPageOptions={props.rowsPerPageOptions}
                                component="div"
                                count={state.rows.length}
                                rowsPerPage={state.pageSize}
                                page={state.pageNum}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </Toolbar>
                        :
                        <Typography variant={'caption'} style={{margin: '2px 0 0 8px', textAlign: 'left'}}>showing
                            all {state.rows.length} results</Typography>
                    }
                </AppBar>
            }

            <TableContainer component={Paper}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            {props.columns.map((o, i) => {
                                if (state.showingFields[o.field] === false) return null;

                                let cell = o.headerName;
                                if (o.renderHeader) {
                                    cell = o.renderHeader(o);
                                }
                                let attrs = {key: `${o.field}head`, variant: 'head'};
                                if (o.sortable === true) {
                                    attrs['aria-sort'] = o.sortDir === 1 ? 'asc' : o.sortDir === -1 ? 'desc' : 'false';
                                    attrs.onClick = () => handleSort(o.field);
                                }
                                return (
                                    <StyledTableCell {...attrs} >
                                        {o.sortable === true && <span className="sortIcon"></span>}
                                        {cell}
                                        {i < props.columns.length - 1 && (
                                            <Divider orientation="vertical" style={{
                                                position: 'absolute',
                                                right: 5,
                                                top: '25%',
                                                height: '50%'
                                            }}/>
                                        )}
                                    </StyledTableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {state.loading === true && <LinearProgress style={{width: '100%'}} color="secondary"/>}
                        {pageRows.map((row, i) => {
                            let keyId = props.getRowId ? props.getRowId(row) : `row-${i}`;
                            return (
                                <TableRow key={keyId}>
                                    {props.columns.map((o, ci) => {
                                        if (state.showingFields[o.field] === false) return null;

                                        let attrs = {padding: o.padding || 'default', key: `${keyId}${o.field}`};
                                        let cell = row[o.field];
                                        if (typeof cell !== 'object') {
                                            attrs.title = typeof cell === 'string' && cell.length > 10 ? `${cell.substr(0, 10)}...` : cell;
                                        }
                                        if (o.style) {
                                            attrs.style = o.style;
                                        }
                                        if (!attrs.sx) {
                                            attrs.sx = {}
                                        }
                                        attrs.sx.alignContent = 'flex-start'

                                        if (o.renderCell) cell = o.renderCell({value: cell, row: row});
                                        else if (o.valueGetter) cell = o.valueGetter({value: cell, row: row});
                                        else if (typeof cell === 'object') cell = JSON.stringify(cell, ' ', 2)
                                        return <TableCell {...attrs}>{cell}</TableCell>;
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default DataTable;

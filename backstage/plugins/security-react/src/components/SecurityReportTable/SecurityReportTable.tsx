import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableContainer from '@material-ui/core/TableContainer';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';

const useStyles = makeStyles(theme => ({
  detailsBox: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  }
}));

function colorByLevel(level: string) {
  switch (level) {
    case 'error':
      return 'red';
    case 'warning':
      return 'orange';
    case 'note':
      return 'yellow';
    default:
      return 'white';
  }
}

export interface SarifResult {
  level: string;
  locations: {
    message: {
      text: string;
    };
  }[];
  message: {
    text: string;
  };
  ruleId: string;
  ruleIndex: number;
}

export const SecurityReportTable = ({
  results,
}: {
  results: SarifResult[];
}) => {
  return (
    <TableContainer component={Paper}>    
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell align="left">ID</TableCell>
            <TableCell align="left">Level</TableCell>
            <TableCell align="left">Location</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((result, index) => (
            <Row key={index} result={result} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const Row = ({ result }: { result: SarifResult }) => {
  const [open, setOpen] = useState(false);
  const classes = useStyles();
  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="left">{result.ruleId}</TableCell>
        <TableCell align="left" style={{ color: colorByLevel(result.level) }}>{result.level}</TableCell>
        <TableCell align="left">{result.locations[0].message.text}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Card className={classes.detailsBox}>
                {result.message.text.split('\n').map(line => <><br/>{line}</>)}
              </Card>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
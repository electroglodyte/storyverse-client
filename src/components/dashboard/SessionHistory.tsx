import React, { useState } from 'react';
import { WritingSession } from '../../supabase-tables';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

interface SessionHistoryProps {
  sessions: WritingSession[];
}

export default function SessionHistory({ sessions }: SessionHistoryProps) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<keyof WritingSession>('session_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session => {
    const searchTerm = filter.toLowerCase();
    const dateString = new Date(session.session_date).toLocaleDateString();
    
    return (
      dateString.toLowerCase().includes(searchTerm) ||
      session.notes?.toLowerCase().includes(searchTerm) ||
      false
    );
  });

  // Sort filtered sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortBy === 'session_date') {
      const dateA = new Date(a[sortBy] as string).getTime();
      const dateB = new Date(b[sortBy] as string).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    const valA = a[sortBy] as number;
    const valB = b[sortBy] as number;
    
    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  // Handle click on sortable header
  const handleSort = (column: keyof WritingSession) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Format a date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Calculate writing speed (words per minute)
  const calculateWPM = (session: WritingSession) => {
    if (!session.duration_minutes || session.duration_minutes === 0) return 0;
    return Math.round(session.words_added / session.duration_minutes);
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold mb-2">No Writing Sessions Yet</h3>
        <p className="text-muted-foreground mb-4">
          Start recording your writing sessions to track your progress.
        </p>
        <p className="text-sm">Click the "Record Session" button to log your first writing session.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Writing Session History</CardTitle>
        <CardDescription>
          View and filter your past writing sessions
        </CardDescription>
        
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter sessions..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('session_date')}
                >
                  Date/Time
                  {sortBy === 'session_date' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('duration_minutes')}
                >
                  Duration
                  {sortBy === 'duration_minutes' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead 
                  className="cursor-pointer text-right"
                  onClick={() => handleSort('words_added')}
                >
                  Words
                  {sortBy === 'words_added' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
                <TableHead className="text-right">WPM</TableHead>
                <TableHead>Scene</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {formatDate(session.session_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.duration_minutes} mins
                  </TableCell>
                  <TableCell className="text-right">
                    {session.words_added.toLocaleString()}
                    {session.words_deleted > 0 && (
                      <span className="text-destructive ml-1">
                        (-{session.words_deleted.toLocaleString()})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {calculateWPM(session)}
                  </TableCell>
                  <TableCell>
                    {session.scene_id ? (
                      <Badge variant="outline">Scene</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {session.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredSessions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No sessions match your filter criteria
          </div>
        )}
      </CardContent>
    </Card>
  );
}

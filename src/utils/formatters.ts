/**
 * Formatters for different text formats (Fountain, Markdown)
 * Version: 0.1.0
 */

/**
 * Basic Fountain renderer for preview
 */
export const renderFountainPreview = (content: string): JSX.Element[] => {
  if (!content) return [];
  
  const lines = content.split('\n');
  return lines.map((line, index) => {
    // Scene headings
    if (line.match(/^(INT|EXT|I\/E)[\.\s]/i) || line.startsWith('.')) {
      return <p key={index} className="font-bold mt-4 mb-2 uppercase">{line.startsWith('.') ? line.substring(1) : line}</p>;
    }
    
    // Character names
    if (line.trim() === line.toUpperCase() && line.trim() !== '' && 
        !line.startsWith('(') && !line.startsWith('!') && !line.startsWith('@') && 
        !line.startsWith('#') && !line.startsWith('.') && !line.startsWith('~')) {
      return <p key={index} className="font-bold text-center mt-4">{line}</p>;
    }
    
    // Parentheticals
    if (line.startsWith('(') && line.endsWith(')')) {
      return <p key={index} className="italic text-center ml-8 mr-8">{line}</p>;
    }
    
    // Dialogue - following character names
    if (index > 0 && 
        (lines[index-1].trim() === lines[index-1].toUpperCase() && lines[index-1].trim() !== '') || 
        (index > 1 && lines[index-2].trim() === lines[index-2].toUpperCase() && 
         lines[index-1].startsWith('(') && lines[index-1].endsWith(')'))) {
      return <p key={index} className="ml-8 mr-8 text-center mb-2">{line}</p>;
    }
    
    // Transitions
    if (line.endsWith('TO:') || line === 'FADE OUT.' || line === 'CUT TO BLACK.') {
      return <p key={index} className="font-bold text-right mt-2 mb-2 uppercase">{line}</p>;
    }
    
    // Section headings
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)[0].length;
      return <p key={index} className={`font-bold mt-3 mb-2 text-${level === 1 ? 'xl' : 'lg'} text-blue-600`}>{line}</p>;
    }
    
    // Notes
    if (line.startsWith('[[') && line.endsWith(']]')) {
      return <p key={index} className="italic text-gray-500 bg-yellow-50 p-1">{line}</p>;
    }
    
    // Default (action)
    return <p key={index} className="mb-2">{line}</p>;
  });
};

/**
 * Basic Markdown renderer for preview
 */
export const renderMarkdownPreview = (content: string): JSX.Element[] => {
  if (!content) return [];
  
  const lines = content.split('\n');
  let inList = false;
  let listItems: JSX.Element[] = [];
  let result: JSX.Element[] = [];
  let key = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    key++;
    
    // Handle lists
    if (line.match(/^[\*\-\+]\s/) || line.match(/^\d+\.\s/)) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      
      const isOrdered = !!line.match(/^\d+\.\s/);
      const content = line.replace(/^[\*\-\+]\s/, '').replace(/^\d+\.\s/, '');
      
      // Process inline formatting
      const formattedContent = processInlineMarkdown(content);
      
      listItems.push(<li key={`list-item-${key}`} dangerouslySetInnerHTML={{ __html: formattedContent }}></li>);
      
      // If next line is not a list item, close the list
      if (i === lines.length - 1 || !(lines[i+1].match(/^[\*\-\+]\s/) || lines[i+1].match(/^\d+\.\s/))) {
        inList = false;
        result.push(
          isOrdered 
            ? <ol key={`list-${key}`} className="list-decimal ml-6 mb-4">{listItems}</ol>
            : <ul key={`list-${key}`} className="list-disc ml-6 mb-4">{listItems}</ul>
        );
      }
      
      continue;
    }
    
    // If we were in a list but this line is not a list item, close the list
    if (inList) {
      inList = false;
      result.push(
        lines[i-1].match(/^\d+\.\s/)
          ? <ol key={`list-${key}`} className="list-decimal ml-6 mb-4">{listItems}</ol>
          : <ul key={`list-${key}`} className="list-disc ml-6 mb-4">{listItems}</ul>
      );
    }
    
    // Headings
    if (line.startsWith('# ')) {
      result.push(<h1 key={key} className="text-3xl font-bold mt-6 mb-3">{processInlineMarkdown(line.substring(2))}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      result.push(<h2 key={key} className="text-2xl font-bold mt-5 mb-3">{processInlineMarkdown(line.substring(3))}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      result.push(<h3 key={key} className="text-xl font-bold mt-4 mb-2">{processInlineMarkdown(line.substring(4))}</h3>);
      continue;
    }
    if (line.startsWith('#### ')) {
      result.push(<h4 key={key} className="text-lg font-bold mt-3 mb-2">{processInlineMarkdown(line.substring(5))}</h4>);
      continue;
    }
    
    // Horizontal rule
    if (line.match(/^(\*\*\*|\-\-\-|\_\_\_)$/)) {
      result.push(<hr key={key} className="my-4 border-t-2" />);
      continue;
    }
    
    // Blockquotes
    if (line.startsWith('> ')) {
      result.push(
        <blockquote key={key} className="border-l-4 border-gray-300 pl-4 py-1 italic text-gray-700">
          {processInlineMarkdown(line.substring(2))}
        </blockquote>
      );
      continue;
    }
    
    // Code blocks (simple implementation)
    if (line.startsWith('```')) {
      let codeContent = '';
      const lang = line.substring(3);
      
      // Find the closing code block
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('```')) {
        codeContent += lines[j] + '\n';
        j++;
      }
      
      result.push(
        <pre key={key} className="bg-gray-100 rounded p-3 my-4 overflow-auto font-mono text-sm">
          <code>{codeContent}</code>
        </pre>
      );
      
      // Skip to after the closing code block
      i = j;
      continue;
    }
    
    // Empty line becomes a paragraph break
    if (line.trim() === '') {
      result.push(<br key={key} />);
      continue;
    }
    
    // Default paragraph
    result.push(
      <p key={key} className="mb-4" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(line) }}></p>
    );
  }
  
  return result;
};

/**
 * Process inline Markdown formatting
 */
const processInlineMarkdown = (text: string): string => {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline code
  text = text.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
  
  // Links
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');
  
  return text;
};

/**
 * Convert plain text to Fountain format
 */
export const convertToFountain = (text: string, title: string): string => {
  if (!text) return '';
  
  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  let fountain = '';
  
  // Add title page
  fountain += `Title: ${title || 'Untitled'}\n\n`;
  
  // Add scene heading if there isn't one already
  if (!paragraphs[0].match(/^(INT|EXT|I\/E)[\.\s]/i)) {
    fountain += `INT. LOCATION - DAY\n\n`;
  }
  
  // Add content
  fountain += paragraphs.join('\n\n');
  
  return fountain;
};

/**
 * Convert plain text to Markdown format
 */
export const convertToMarkdown = (text: string, title: string): string => {
  if (!text) return '';
  
  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  let markdown = '';
  
  // Add title
  markdown += `# ${title || 'Untitled'}\n\n`;
  
  // Add content
  markdown += paragraphs.join('\n\n');
  
  return markdown;
};

/**
 * Format detection
 */
export const detectFormat = (text: string): 'plain' | 'fountain' | 'markdown' => {
  if (!text) return 'plain';
  
  // Count Markdown elements
  const mdElements = (text.match(/(\#{1,6}\s|\*\*.*?\*\*|__.*?__|_.*?_|\[.*?\]\(.*?\)|\`.*?\`)/g) || []).length;
  
  // Count Fountain elements
  const fountainElements = (text.match(/^(INT|EXT|I\/E)[\.\s]|^[A-Z\s]+$|^\(.*?\)$|^CUT TO:|^FADE (IN|OUT):|^DISSOLVE TO:/gm) || []).length;
  
  if (fountainElements > mdElements && fountainElements > 3) {
    return 'fountain';
  } else if (mdElements > fountainElements && mdElements > 3) {
    return 'markdown';
  }
  
  return 'plain';
};

/**
 * Get diff between two text versions
 */
export const getTextDiff = (oldText: string, newText: string): { type: 'added' | 'removed' | 'unchanged', content: string, lineNumber: number }[] => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: { type: 'added' | 'removed' | 'unchanged', content: string, lineNumber: number }[] = [];
  
  let oldIndex = 0;
  let newIndex = 0;
  
  // Simple line-by-line comparison
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // All remaining lines in new are added
      result.push({
        type: 'added',
        content: newLines[newIndex],
        lineNumber: newIndex + 1
      });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // All remaining lines in old are removed
      result.push({
        type: 'removed',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1
      });
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines are the same
      result.push({
        type: 'unchanged',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1
      });
      oldIndex++;
      newIndex++;
    } else {
      // Lines are different
      result.push({
        type: 'removed',
        content: oldLines[oldIndex],
        lineNumber: oldIndex + 1
      });
      result.push({
        type: 'added',
        content: newLines[newIndex],
        lineNumber: newIndex + 1
      });
      oldIndex++;
      newIndex++;
    }
  }
  
  return result;
};

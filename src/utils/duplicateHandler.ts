// Modify the checkForDuplicates function in Importer.tsx to handle duplicates better

  // Enhanced duplicate detection with more robust type handling
  const checkForDuplicates = async (type: 'characters' | 'locations' | 'plotlines' | 'scenes' | 'events' | 'objects', elements: any[]) => {
    if (!elements || elements.length === 0) return;
    
    try {
      const tableName = type === 'objects' ? 'items' : type;
      const nameField = type === 'plotlines' || type === 'scenes' || type === 'events' ? 'title' : 'name';
      
      const duplicatesInfo: Record<string, DuplicateInfo[]> = {};
      
      // Track which elements to remove due to duplicates
      const elementsToRemove: string[] = [];
      
      // For each extracted element, check for similar entries in the database
      for (const element of elements) {
        // Skip elements without the required name field
        if (!element || typeof element[nameField] !== 'string' || !element[nameField]) continue;
        
        const elementName = element[nameField];
        
        // Get a safe ID for the element that is guaranteed to be a string
        const safeId = getSafeId(element);
        
        // First check for exact matches - use await directly here
        const exactResult = await safeSupabaseQuery(
          supabase
            .from(tableName)
            .select('id, ' + nameField)
            .eq(nameField, elementName)
        );
        
        // Then check for similar matches (case insensitive) - use await directly here
        const similarResult = await safeSupabaseQuery(
          supabase
            .from(tableName)
            .select('id, ' + nameField)
            .neq('id', safeId)
            .ilike(nameField, `%${elementName}%`)
        );
        
        // Handle errors if any
        if (exactResult.error) {
          console.error(`Error checking for exact duplicates:`, exactResult.error);
          continue;
        }
        
        if (similarResult.error) {
          console.error(`Error checking for similar duplicates:`, similarResult.error);
          continue;
        }
        
        // Combine and process matches
        const allMatches: DuplicateInfo[] = [];
        
        // Process exact matches
        exactResult.data.forEach(match => {
          // Using direct access within a guard clause
          if (match && typeof match.id === 'string' && typeof match[nameField] === 'string') {
            allMatches.push({
              id: match.id,
              name: match[nameField],
              match_type: 'exact',
              similarity: 100
            });
            
            // If exact match, mark this element for removal
            if (type === 'characters') { // Only auto-remove duplicates for characters
              elementsToRemove.push(safeId);
            }
          }
        });
        
        // Process similar matches
        similarResult.data.forEach(match => {
          // Skip if already added as exact match or if missing required fields
          if (!match || typeof match.id !== 'string' || typeof match[nameField] !== 'string') return;
          
          if (!allMatches.some(m => m.id === match.id)) {
            // Calculate similarity (simple version)
            const nameLower = elementName.toLowerCase();
            const matchNameLower = match[nameField].toLowerCase();
            const similarity = matchNameLower.includes(nameLower) || nameLower.includes(matchNameLower) ? 70 : 50;
            
            allMatches.push({
              id: match.id,
              name: match[nameField],
              match_type: 'similar',
              similarity
            });
            
            // If high similarity match (> 80%), consider auto-removing
            if (type === 'characters' && similarity > 80) {
              elementsToRemove.push(safeId);
            }
          }
        });
        
        // If matches found, store them with the element's safe id
        if (allMatches.length > 0) {
          duplicatesInfo[safeId] = allMatches;
        }
      }
      
      // Update state with duplicate info
      if (Object.keys(duplicatesInfo).length > 0) {
        setDuplicateElements(prev => ({
          ...prev,
          ...duplicatesInfo
        }));
        
        console.log(`Found ${Object.keys(duplicatesInfo).length} elements with potential duplicates`);
        
        // For characters, automatically remove exact duplicates
        if (type === 'characters' && elementsToRemove.length > 0) {
          console.log(`Auto-removing ${elementsToRemove.length} duplicate characters`);
          
          // Update extracted elements to remove duplicates
          setExtractedElements(prev => {
            if (!prev) return null;
            return {
              ...prev,
              [type]: prev[type].filter((elem: any) => {
                const safeId = getSafeId(elem);
                return !elementsToRemove.includes(safeId);
              })
            };
          });
          
          // Update selected elements to remove duplicates
          setSelectedElements(prev => ({
            ...prev,
            [type]: prev[type].filter(id => !elementsToRemove.includes(id))
          }));
        }
      }
    } catch (err) {
      console.error(`Error in checkForDuplicates:`, getErrorMessage(err));
    }
  };
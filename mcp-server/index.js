// ======================================================
// SCENE MANAGEMENT IMPLEMENTATION FUNCTIONS
// ======================================================

/**
 * Imports a new scene into the system
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created scene data
 */
async function importScene(args) {
  try {
    const {
      content,
      title,
      project_id, // Note: StoryVerse uses story_id, not project_id
      type = 'scene',
      format = 'plain',
      sequence_number = null
    } = args;
    
    // Map project_id to story_id for consistency with existing codebase
    const story_id = project_id;
    
    // Validate required fields
    if (!content) {
      throw new Error("Scene content is required");
    }
    
    if (!story_id) {
      throw new Error("Project/Story ID is required");
    }
    
    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Determine sequence number if not provided
    let seq_num = sequence_number;
    if (seq_num === null) {
      const { data: lastScene, error: seqError } = await supabase
        .from('scenes')
        .select('sequence_number')
        .eq('story_id', story_id)
        .order('sequence_number', { ascending: false })
        .limit(1);
      
      if (!seqError && lastScene.length > 0) {
        seq_num = lastScene[0].sequence_number + 10;
      } else {
        seq_num = 10; // Start at 10 if no scenes exist
      }
    }
    
    // Create the scene
    const sceneTitle = title || `New Scene ${new Date().toISOString()}`;
    const { data: scene, error } = await supabase
      .from('scenes')
      .insert({
        title: sceneTitle,
        content,
        story_id,
        type,
        format,
        sequence_number: seq_num,
        is_visible: true,
        metadata: {}
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create initial version record
    const { data: version, error: versionError } = await supabase
      .from('scene_versions')
      .insert({
        scene_id: scene.id,
        content,
        version_number: 1,
        notes: 'Initial version'
      })
      .select()
      .single();
    
    if (versionError) {
      console.error('Error creating initial version:', versionError);
      // Continue even if version creation fails
    }
    
    return {
      success: true,
      scene,
      version: version || null,
      message: `Successfully imported scene "${sceneTitle}" into "${story.title}"`
    };
  } catch (error) {
    console.error('Error in import_scene:', error);
    throw error;
  }
}

/**
 * Imports and parses a full text into multiple scenes
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created scenes data
 */
async function importText(args) {
  try {
    const {
      content,
      project_id, // StoryVerse uses story_id
      detect_scenes = true,
      scene_delimiter = null
    } = args;
    
    // Map project_id to story_id for consistency
    const story_id = project_id;
    
    // Validate required fields
    if (!content) {
      throw new Error("Text content is required");
    }
    
    if (!story_id) {
      throw new Error("Project/Story ID is required");
    }
    
    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Parse the text into scenes
    let scenes = [];
    
    if (detect_scenes) {
      // Determine starting sequence number
      const { data: lastScene, error: seqError } = await supabase
        .from('scenes')
        .select('sequence_number')
        .eq('story_id', story_id)
        .order('sequence_number', { ascending: false })
        .limit(1);
      
      let nextSequence = 10;
      if (!seqError && lastScene.length > 0) {
        nextSequence = lastScene[0].sequence_number + 10;
      }
      
      // Split the text based on delimiter or heuristics
      const sections = splitTextIntoScenes(content, scene_delimiter);
      
      // Create each scene
      for (const section of sections) {
        const { data: scene, error } = await supabase
          .from('scenes')
          .insert({
            title: section.title || `Scene ${nextSequence}`,
            content: section.content,
            story_id,
            type: 'scene',
            format: detectFormat(section.content),
            sequence_number: nextSequence,
            is_visible: true,
            metadata: {}
          })
          .select()
          .single();
        
        if (error) {
          console.error(`Error creating scene: ${error.message}`);
          continue;
        }
        
        // Create initial version
        await supabase
          .from('scene_versions')
          .insert({
            scene_id: scene.id,
            content: section.content,
            version_number: 1,
            notes: 'Initial version from text import'
          });
        
        scenes.push(scene);
        nextSequence += 10;
      }
    } else {
      // Import as a single scene
      const result = await importScene({
        content,
        title: 'Imported Text',
        project_id: story_id,
        type: 'scene',
        format: detectFormat(content)
      });
      
      scenes = [result.scene];
    }
    
    return {
      success: true,
      scenes,
      scene_count: scenes.length,
      message: `Successfully imported text as ${scenes.length} scene(s) into "${story.title}"`
    };
  } catch (error) {
    console.error('Error in import_text:', error);
    throw error;
  }
}

/**
 * Helper function to split text into scenes based on delimiter or heuristics
 */
function splitTextIntoScenes(text, delimiter) {
  const sections = [];
  
  if (delimiter) {
    // Split by custom delimiter
    const parts = text.split(new RegExp(delimiter, 'g'));
    
    parts.forEach((part, index) => {
      if (part.trim().length === 0) return;
      
      // Extract title from first line if it looks like a title
      const lines = part.trim().split('\n');
      let title = `Scene ${index + 1}`;
      let content = part.trim();
      
      // If first line is short and doesn't end with punctuation, it's likely a title
      if (lines[0].length < 50 && !lines[0].match(/[.!?:;,]$/)) {
        title = lines[0].trim();
        content = lines.slice(1).join('\n').trim();
      }
      
      sections.push({ title, content });
    });
  } else {
    // Detect scenes based on patterns:
    
    // 1. Look for scene headers in screenplay format (e.g., "INT. BEDROOM - DAY")
    const screenplayPattern = /^(INT|EXT|INT\/EXT|EXT\/INT|I\/E|E\/I)[. ].+?(-|–|—)[ ]?.+$/gm;
    
    // 2. Look for chapter/scene markers like "Chapter 1", "Scene 3", etc.
    const chapterPattern = /^(Chapter|CHAPTER|Scene|SCENE)[ \t]*[\d\w]+.*$/gm;
    
    // 3. Look for markdown-style headers (e.g., "# Scene Title")
    const markdownPattern = /^#{1,3}[ \t]*.+$/gm;
    
    // 4. Look for line breaks with symbols (e.g., "* * *" or "---")
    const breakPattern = /^[ \t]*([*\-=#_~+]{3,})[ \t]*$/gm;
    
    // Find all potential scene breaks
    const matches = [];
    let match;
    
    // Collect all potential break points
    [screenplayPattern, chapterPattern, markdownPattern, breakPattern].forEach(pattern => {
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          index: match.index,
          text: match[0]
        });
      }
    });
    
    // Sort by position in text
    matches.sort((a, b) => a.index - b.index);
    
    // Split text at each break point
    if (matches.length > 0) {
      let lastIndex = 0;
      
      matches.forEach((match, index) => {
        if (match.index > lastIndex) {
          const sectionText = text.substring(lastIndex, match.index).trim();
          if (sectionText.length > 0) {
            sections.push({
              title: `Scene ${sections.length + 1}`,
              content: sectionText
            });
          }
        }
        
        // The matched header becomes the title for the next section
        const nextContent = index < matches.length - 1
          ? text.substring(match.index, matches[index + 1].index)
          : text.substring(match.index);
        
        if (nextContent.trim().length > 0) {
          // Extract title from the header line
          const headerLine = match.text.trim();
          let title = headerLine;
          
          // Clean up title
          title = title.replace(/^#{1,3}[ \t]*/, ''); // Remove markdown header markers
          title = title.replace(/^(Chapter|CHAPTER|Scene|SCENE)[ \t]*[\d\w]+[ \t]*[:\.]/i, '').trim(); // Clean chapter/scene prefixes
          
          if (title.length > 50) {
            title = title.substring(0, 47) + '...';
          }
          
          sections.push({
            title: title || `Scene ${sections.length + 1}`,
            content: nextContent.trim()
          });
        }
        
        lastIndex = match.index + match.text.length;
      });
      
      // Add final section if needed
      if (lastIndex < text.length) {
        const finalText = text.substring(lastIndex).trim();
        if (finalText.length > 0) {
          sections.push({
            title: `Scene ${sections.length + 1}`,
            content: finalText
          });
        }
      }
    } else {
      // No scene breaks found, treat as one scene
      sections.push({
        title: 'Scene 1',
        content: text.trim()
      });
    }
  }
  
  return sections;
}

/**
 * Helper function to detect the format of content
 */
function detectFormat(content) {
  // Check for Fountain format markers
  const fountainPatterns = [
    /^(INT|EXT|INT\/EXT|EXT\/INT|I\/E|E\/I)[. ].+?(-|–|—)[ ]?.+$/m, // Scene headers
    /^[A-Z][A-Z\s]+$/m, // Character names
    /^\([^)]+\)$/m, // Parentheticals
    /^\.[\w\s]+/m, // Scene action starting with a dot
  ];
  
  const hasFountainSyntax = fountainPatterns.some(pattern => pattern.test(content));
  
  if (hasFountainSyntax) return 'fountain';
  
  // Check for Markdown syntax
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m, // Headers
    /^\*\*.+\*\*$/m, // Bold
    /^\*.+\*$/m, // Italic
    /^>\s+.+$/m, // Blockquotes
    /^-\s+.+$/m, // Unordered lists
    /^\d+\.\s+.+$/m, // Ordered lists
    /^```[\s\S]+```$/m, // Code blocks
  ];
  
  const hasMarkdownSyntax = markdownPatterns.some(pattern => pattern.test(content));
  
  if (hasMarkdownSyntax) return 'markdown';
  
  // Default to plain text
  return 'plain';
}

/**
 * Creates a new version of an existing scene
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created version data
 */
async function createSceneVersion(args) {
  try {
    const {
      scene_id,
      content,
      notes = ''
    } = args;
    
    // Validate required fields
    if (!scene_id || !content) {
      throw new Error("Scene ID and content are required");
    }
    
    // Verify scene exists and get current data
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // Get the current highest version number
    const { data: versions, error: versionsError } = await supabase
      .from('scene_versions')
      .select('version_number')
      .eq('scene_id', scene_id)
      .order('version_number', { ascending: false })
      .limit(1);
    
    if (versionsError) throw versionsError;
    
    const nextVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
    
    // Create new version
    const { data: version, error: versionError } = await supabase
      .from('scene_versions')
      .insert({
        scene_id,
        content,
        version_number: nextVersionNumber,
        notes
      })
      .select()
      .single();
    
    if (versionError) throw versionError;
    
    // Update the scene with the new content
    const { data: updatedScene, error: updateError } = await supabase
      .from('scenes')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', scene_id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      scene: updatedScene,
      version,
      previous_version: versions.length > 0 ? versions[0].version_number : null,
      message: `Successfully created version ${nextVersionNumber} of scene "${scene.title}"`
    };
  } catch (error) {
    console.error('Error in create_scene_version:', error);
    throw error;
  }
}

/**
 * Retrieves version history for a scene
 * 
 * @param {object} args - The function arguments
 * @returns {object} Scene versions
 */
async function getSceneVersions(args) {
  try {
    const { scene_id } = args;
    
    // Validate required fields
    if (!scene_id) {
      throw new Error("Scene ID is required");
    }
    
    // Verify scene exists
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // Get all versions
    const { data: versions, error: versionsError } = await supabase
      .from('scene_versions')
      .select('*')
      .eq('scene_id', scene_id)
      .order('version_number', { ascending: false });
    
    if (versionsError) throw versionsError;
    
    return {
      success: true,
      scene,
      versions,
      version_count: versions.length,
      current_content: scene.content,
      message: `Retrieved ${versions.length} versions for scene "${scene.title}"`
    };
  } catch (error) {
    console.error('Error in get_scene_versions:', error);
    throw error;
  }
}

/**
 * Restores a scene to a previous version
 * 
 * @param {object} args - The function arguments
 * @returns {object} Restored scene data
 */
async function restoreSceneVersion(args) {
  try {
    const { version_id } = args;
    
    // Validate required fields
    if (!version_id) {
      throw new Error("Version ID is required");
    }
    
    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('scene_versions')
      .select('*')
      .eq('id', version_id)
      .single();
    
    if (versionError || !version) {
      throw new Error(`Version with ID ${version_id} not found`);
    }
    
    // Get the scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', version.scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${version.scene_id} not found`);
    }
    
    // Create a new version before restoring (to save current state)
    const { data: currentVersion, error: currentError } = await supabase
      .from('scene_versions')
      .select('version_number')
      .eq('scene_id', scene.id)
      .order('version_number', { ascending: false })
      .limit(1);
    
    if (!currentError && currentVersion.length > 0) {
      // Only create a backup version if the content is different
      if (scene.content !== version.content) {
        await supabase
          .from('scene_versions')
          .insert({
            scene_id: scene.id,
            content: scene.content,
            version_number: currentVersion[0].version_number + 1,
            notes: `Automatic backup before restoring version ${version.version_number}`
          });
      }
    }
    
    // Update the scene with the restored content
    const { data: updatedScene, error: updateError } = await supabase
      .from('scenes')
      .update({
        content: version.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', scene.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      scene: updatedScene,
      restored_version: version,
      message: `Successfully restored scene "${scene.title}" to version ${version.version_number}`
    };
  } catch (error) {
    console.error('Error in restore_scene_version:', error);
    throw error;
  }
}

/**
 * Creates a detailed comparison between two scene versions
 * 
 * @param {object} args - The function arguments
 * @returns {object} Comparison data
 */
async function compareSceneVersions(args) {
  try {
    const {
      scene_id,
      version_1 = null,
      version_2 = null,
      format = 'html'
    } = args;
    
    // Validate required fields
    if (!scene_id) {
      throw new Error("Scene ID is required");
    }
    
    // Get all versions for the scene
    const { data: versions, error: versionsError } = await supabase
      .from('scene_versions')
      .select('*')
      .eq('scene_id', scene_id)
      .order('version_number', { ascending: false });
    
    if (versionsError) throw versionsError;
    
    if (versions.length < 2) {
      throw new Error("Scene does not have enough versions for comparison");
    }
    
    // Determine which versions to compare
    let oldVersion, newVersion;
    
    if (version_1 !== null && version_2 !== null) {
      // Find specific versions requested
      oldVersion = versions.find(v => v.version_number === version_1);
      newVersion = versions.find(v => v.version_number === version_2);
      
      if (!oldVersion || !newVersion) {
        throw new Error("One or both specified versions not found");
      }
    } else {
      // Compare latest to previous by default
      newVersion = versions[0];
      oldVersion = versions[1];
    }
    
    // Ensure newer version is always second
    if (oldVersion.version_number > newVersion.version_number) {
      [oldVersion, newVersion] = [newVersion, oldVersion];
    }
    
    // Get the scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('title')
      .eq('id', scene_id)
      .single();
    
    if (sceneError) throw sceneError;
    
    // Generate diff
    const diff = generateDiff(
      oldVersion.content,
      newVersion.content,
      format
    );
    
    return {
      success: true,
      scene_title: scene.title,
      old_version: {
        number: oldVersion.version_number,
        created_at: oldVersion.created_at,
        notes: oldVersion.notes
      },
      new_version: {
        number: newVersion.version_number,
        created_at: newVersion.created_at,
        notes: newVersion.notes
      },
      comparison: diff,
      format
    };
  } catch (error) {
    console.error('Error in compare_scene_versions:', error);
    throw error;
  }
}

/**
 * Helper function to generate text diff
 */
function generateDiff(oldText, newText, format) {
  // Simple character-by-character diff for demonstration
  // In a real implementation, you'd use a diff library like 'diff' or 'jsdiff'
  
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // Track additions, deletions and unchanged lines
  const changes = [];
  
  // Find the maximum length
  const maxLen = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : null;
    const newLine = i < newLines.length ? newLines[i] : null;
    
    if (oldLine === null) {
      // Line added
      changes.push({ type: 'addition', content: newLine });
    } else if (newLine === null) {
      // Line removed
      changes.push({ type: 'deletion', content: oldLine });
    } else if (oldLine !== newLine) {
      // Line changed
      changes.push({ type: 'deletion', content: oldLine });
      changes.push({ type: 'addition', content: newLine });
    } else {
      // Line unchanged
      changes.push({ type: 'unchanged', content: oldLine });
    }
  }
  
  // Format the output according to requested format
  if (format === 'html') {
    let html = '<div class="diff">';
    changes.forEach(change => {
      if (change.type === 'addition') {
        html += `<div class="addition">${escapeHtml(change.content)}</div>`;
      } else if (change.type === 'deletion') {
        html += `<div class="deletion">${escapeHtml(change.content)}</div>`;
      } else {
        html += `<div class="unchanged">${escapeHtml(change.content)}</div>`;
      }
    });
    html += '</div>';
    return html;
  } else if (format === 'text') {
    let text = '';
    changes.forEach(change => {
      if (change.type === 'addition') {
        text += `+ ${change.content}\n`;
      } else if (change.type === 'deletion') {
        text += `- ${change.content}\n`;
      } else {
        text += `  ${change.content}\n`;
      }
    });
    return text;
  } else {
    // JSON format
    return changes;
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Adds a comment to a scene
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created comment data
 */
async function addSceneComment(args) {
  try {
    const {
      scene_id,
      content,
      position = null,
      type = 'comment'
    } = args;
    
    // Validate required fields
    if (!scene_id || !content) {
      throw new Error("Scene ID and comment content are required");
    }
    
    // Verify scene exists
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('title')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // Create the comment
    const { data: comment, error } = await supabase
      .from('scene_comments')
      .insert({
        scene_id,
        content,
        position: position ? JSON.stringify(position) : null,
        type,
        resolved: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      comment,
      message: `Successfully added ${type} to scene "${scene.title}"`
    };
  } catch (error) {
    console.error('Error in add_scene_comment:', error);
    throw error;
  }
}

/**
 * Marks a comment as resolved or unresolved
 * 
 * @param {object} args - The function arguments
 * @returns {object} Updated comment data
 */
async function resolveSceneComment(args) {
  try {
    const {
      comment_id,
      resolved
    } = args;
    
    // Validate required fields
    if (!comment_id) {
      throw new Error("Comment ID is required");
    }
    
    // Update the comment
    const { data: comment, error } = await supabase
      .from('scene_comments')
      .update({
        resolved: !!resolved
      })
      .eq('id', comment_id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Get scene info for the message
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('title')
      .eq('id', comment.scene_id)
      .single();
    
    const sceneName = !sceneError ? scene.title : 'the scene';
    
    return {
      success: true,
      comment,
      message: `Successfully marked comment as ${resolved ? 'resolved' : 'unresolved'} in "${sceneName}"`
    };
  } catch (error) {
    console.error('Error in resolve_scene_comment:', error);
    throw error;
  }
}

/**
 * Processes a scene according to instructions, creating a new version
 * 
 * @param {object} args - The function arguments
 * @returns {object} Updated scene data
 */
async function processScene(args) {
  try {
    const {
      scene_id,
      instructions
    } = args;
    
    // Validate required fields
    if (!scene_id || !instructions) {
      throw new Error("Scene ID and instructions are required");
    }
    
    // Get the current scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // In a real implementation, you would use Claude or another AI to process
    // the scene according to the instructions and generate new content.
    // For this sample implementation, we'll just append the instructions 
    // as a placeholder.
    
    const processedContent = scene.content + '\n\n/* ' +
      `These instructions would be applied by Claude: ${instructions}` +
      ' */';
    
    // Create a new version with the processed content
    const result = await createSceneVersion({
      scene_id,
      content: processedContent,
      notes: `Processed with instructions: ${instructions}`
    });
    
    return {
      success: result.success,
      scene: result.scene,
      version: result.version,
      instructions,
      message: `Successfully processed scene "${scene.title}" according to instructions`
    };
  } catch (error) {
    console.error('Error in process_scene:', error);
    throw error;
  }
}

/**
 * Creates a new scene version that addresses specified comments
 * 
 * @param {object} args - The function arguments
 * @returns {object} Updated scene data
 */
async function addressSceneComments(args) {
  try {
    const {
      scene_id,
      comment_ids = null // If null, address all unresolved comments
    } = args;
    
    // Validate required fields
    if (!scene_id) {
      throw new Error("Scene ID is required");
    }
    
    // Get the current scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // Get comments to address
    let commentsQuery = supabase
      .from('scene_comments')
      .select('*')
      .eq('scene_id', scene_id)
      .eq('resolved', false);
    
    if (comment_ids) {
      commentsQuery = commentsQuery.in('id', comment_ids);
    }
    
    const { data: comments, error: commentsError } = await commentsQuery;
    
    if (commentsError) throw commentsError;
    
    if (comments.length === 0) {
      return {
        success: false,
        message: "No unresolved comments found to address"
      };
    }
    
    // In a real implementation, you would use Claude or another AI to modify
    // the scene content to address each comment. For this sample, we'll
    // just annotate the current content.
    
    let processedContent = scene.content;
    const addressedComments = [];
    
    comments.forEach(comment => {
      const commentMarker = `\n\n/* ADDRESSED COMMENT: ${comment.content} */\n`;
      processedContent += commentMarker;
      addressedComments.push(comment.id);
    });
    
    // Create a new version with the processed content
    const result = await createSceneVersion({
      scene_id,
      content: processedContent,
      notes: `Addressed ${comments.length} comment(s)`
    });
    
    // Mark comments as resolved
    if (addressedComments.length > 0) {
      await supabase
        .from('scene_comments')
        .update({ resolved: true })
        .in('id', addressedComments);
    }
    
    return {
      success: result.success,
      scene: result.scene,
      version: result.version,
      addressed_comments: comments.length,
      comment_ids: addressedComments,
      message: `Successfully addressed ${comments.length} comment(s) in scene "${scene.title}"`
    };
  } catch (error) {
    console.error('Error in address_scene_comments:', error);
    throw error;
  }
}

/**
 * Exports a complete project as a single document
 * 
 * @param {object} args - The function arguments
 * @returns {object} Exported project text
 */
async function exportProject(args) {
  try {
    const {
      project_id, // StoryVerse uses story_id
      format = 'text',
      include_types = null
    } = args;
    
    // Map project_id to story_id for consistency
    const story_id = project_id;
    
    // Validate required fields
    if (!story_id) {
      throw new Error("Project/Story ID is required");
    }
    
    // Get the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Query for all scenes
    let sceneQuery = supabase
      .from('scenes')
      .select('*')
      .eq('story_id', story_id)
      .eq('is_visible', true)
      .order('sequence_number', { ascending: true });
    
    if (include_types && include_types.length > 0) {
      sceneQuery = sceneQuery.in('type', include_types);
    }
    
    const { data: scenes, error: scenesError } = await sceneQuery;
    
    if (scenesError) throw scenesError;
    
    // Generate the export content based on format
    let content = '';
    
    if (format === 'markdown') {
      content = `# ${story.title}\n\n`;
      
      if (story.description) {
        content += `${story.description}\n\n`;
      }
      
      scenes.forEach((scene, index) => {
        content += `## ${scene.title}\n\n`;
        content += `${scene.content}\n\n`;
        
        if (index < scenes.length - 1) {
          content += '---\n\n';
        }
      });
    } 
    else if (format === 'html') {
      content = `<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(story.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    h2 { margin-top: 2em; border-bottom: 1px solid #ddd; }
    .scene { margin-bottom: 2em; }
    .scene-divider { text-align: center; margin: 2em 0; }
    .scene-content { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${escapeHtml(story.title)}</h1>`;

      if (story.description) {
        content += `\n  <p>${escapeHtml(story.description)}</p>`;
      }
      
      scenes.forEach((scene, index) => {
        content += `\n  <div class="scene">
    <h2>${escapeHtml(scene.title)}</h2>
    <div class="scene-content">${escapeHtml(scene.content)}</div>
  </div>`;
        
        if (index < scenes.length - 1) {
          content += '\n  <div class="scene-divider">* * *</div>';
        }
      });
      
      content += '\n</body>\n</html>';
    } 
    else {
      // Default to plain text
      content = `${story.title.toUpperCase()}\n\n`;
      
      if (story.description) {
        content += `${story.description}\n\n`;
      }
      
      scenes.forEach((scene, index) => {
        content += `${scene.title.toUpperCase()}\n\n`;
        content += `${scene.content}\n\n`;
        
        if (index < scenes.length - 1) {
          content += '* * *\n\n';
        }
      });
    }
    
    return {
      success: true,
      story: {
        id: story.id,
        title: story.title
      },
      scenes: scenes.map(s => ({ id: s.id, title: s.title })),
      scene_count: scenes.length,
      format,
      content,
      message: `Successfully exported ${scenes.length} scenes from "${story.title}"`
    };
  } catch (error) {
    console.error('Error in export_project:', error);
    throw error;
  }
}

/**
 * Exports scenes in Fountain format for screenplay formatting
 * 
 * @param {object} args - The function arguments
 * @returns {object} Fountain formatted screenplay
 */
async function exportFountain(args) {
  try {
    const {
      project_id, // StoryVerse uses story_id
      scene_ids = null,
      include_title_page = true
    } = args;
    
    // Map project_id to story_id for consistency
    const story_id = project_id;
    
    // Validate required fields
    if (!story_id) {
      throw new Error("Project/Story ID is required");
    }
    
    // Get the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Query for scenes
    let sceneQuery = supabase
      .from('scenes')
      .select('*')
      .eq('story_id', story_id)
      .eq('is_visible', true)
      .order('sequence_number', { ascending: true });
    
    if (scene_ids && scene_ids.length > 0) {
      sceneQuery = sceneQuery.in('id', scene_ids);
    }
    
    const { data: scenes, error: scenesError } = await sceneQuery;
    
    if (scenesError) throw scenesError;
    
    // Generate Fountain screenplay
    let content = '';
    
    // Add title page if requested
    if (include_title_page) {
      content += `Title: ${story.title}\n`;
      
      if (story.description) {
        content += `Logline: ${story.description.split('\n')[0]}\n`;
      }
      
      // Add other standard title page elements
      const now = new Date();
      content += `Draft date: ${now.toLocaleDateString()}\n`;
      content += `\n\n`;
    }
    
    // Process each scene
    scenes.forEach((scene, index) => {
      // For scenes already in Fountain format, include as-is
      if (scene.format === 'fountain') {
        content += scene.content;
      } else {
        // Convert scene to basic Fountain format
        content += convertToFountain(scene);
      }
      
      // Add a newline between scenes
      if (index < scenes.length - 1) {
        content += '\n\n';
      }
    });
    
    return {
      success: true,
      story: {
        id: story.id,
        title: story.title
      },
      scenes: scenes.map(s => ({ id: s.id, title: s.title })),
      scene_count: scenes.length,
      content,
      message: `Successfully exported ${scenes.length} scenes in Fountain format from "${story.title}"`
    };
  } catch (error) {
    console.error('Error in export_fountain:', error);
    throw error;
  }
}

/**
 * Helper function to convert scene content to Fountain format
 */
function convertToFountain(scene) {
  let fountain = '';
  
  // Add scene heading if it doesn't exist
  if (!scene.content.match(/^(INT|EXT|INT\.\/EXT\.|INT\/EXT|I\/E)[. ]/m)) {
    fountain += `\n\n# ${scene.title}\n\n`;
    fountain += 'INT. UNSPECIFIED LOCATION - DAY\n\n';
  }
  
  // Basic conversion of content
  const lines = scene.content.split('\n');
  let inDialogue = false;
  let inAction = true;
  
  lines.forEach(line => {
    line = line.trim();
    
    // Skip empty lines
    if (line === '') {
      fountain += '\n';
      inAction = true;
      inDialogue = false;
      return;
    }
    
    // Check for character cues (all caps lines)
    if (line === line.toUpperCase() && line.length > 1 && line.length < 50 && !line.startsWith('INT') && !line.startsWith('EXT')) {
      fountain += `\n${line}\n`;
      inDialogue = true;
      inAction = false;
    }
    // Check for parentheticals
    else if (line.startsWith('(') && line.endsWith(')') && line.length < 50) {
      fountain += `${line}\n`;
    }
    // Handle dialogue or action
    else {
      if (inDialogue) {
        fountain += `${line}\n`;
      } else {
        if (!inAction) {
          fountain += '\n';
        }
        fountain += `${line}\n`;
        inAction = true;
      }
    }
  });
  
  return fountain;
}

// ======================================================
// TOOL REGISTRATION
// ======================================================

// Create array of all available tools
const tools = [
  analyzeWritingSampleTool,
  getStyleProfileTool,
  createStyleProfileTool,
  writeInStyleTool,
  getCharacterJourneyTool,
  compareCharacterJourneysTool,
  updateEventSequenceTool,
  normalizeEventSequenceTool,
  createStoryEventTool,
  addEventWithDependenciesTool,
  addCharacterEventTool,
  findSharedEventsTool,
  addSceneWithEventsTool,
  visualizeTimelineTool,
  analyzeEventImpactTool,
  detectDependencyConflictsTool,
  suggestMissingEventsTool,
  analyzeStoryTool,
  setupStoryWorldTool,
  setupSeriesTool,
  setupStoryTool,
  createCharacterTool,
  createLocationTool,
  createFactionTool,
  createRelationshipTool,
  createItemTool,
  createCharacterArcTool,
  createPlotlineTool,
  // Scene Management Tools
  importSceneTool,
  importTextTool,
  createSceneVersionTool,
  getSceneVersionsTool,
  restoreSceneVersionTool,
  compareSceneVersionsTool,
  addSceneCommentTool,
  resolveSceneCommentTool,
  processSceneTool,
  addressSceneCommentsTool,
  exportProjectTool,
  exportFountainTool
];

// Create the MCP server
const server = new Server({
  transport: new StdioServerTransport(),
});

// ------------------------------------------------------
// Register the tools with the server
// ------------------------------------------------------

// List tools functionality
server.handle(ListToolsRequestSchema, async () => ({
  tools
}));

// Call tool functionality
server.handle(CallToolRequestSchema, async (request) => {
  const { name, args = {} } = request;

  console.error(`Tool call: ${name}`);

  // =====================================================
  // STYLE ANALYSIS TOOL HANDLERS
  // =====================================================
  
  if (name === 'analyze_writing_sample') {
    const result = await analyzeWritingSample(args);
    
    return {
      content: [
        {
          type: "text",
          text: `# Writing Style Analysis\n\n${result.summary}`,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'get_style_profile') {
    const result = await getStyleProfile(args);
    
    let responseText = `# Style Profile: ${result.profile.name}\n\n`;
    
    if (result.profile.description) {
      responseText += `${result.profile.description}\n\n`;
    }
    
    if (result.style_guidance) {
      responseText += result.style_guidance;
    }
    
    if (result.examples && result.examples.length > 0) {
      responseText += `## Example Excerpts\n\n`;
      result.examples.forEach(example => {
        responseText += `### ${example.title}\n\n${example.excerpt}\n\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'create_style_profile') {
    const result = await createStyleProfile(args);
    
    let responseText = `# Style Profile Created: ${result.name}\n\n`;
    
    if (result.description) {
      responseText += `${result.description}\n\n`;
    }
    
    responseText += `Successfully created profile based on ${result.sample_count} samples.\n\n`;
    
    // Add some information about the style characteristics
    if (result.parameters) {
      responseText += `## Style Characteristics\n\n`;
      
      if (result.parameters.sentence) {
        const sentenceLength = result.parameters.sentence.avg_length < 12 ? 'short' :
          result.parameters.sentence.avg_length < 20 ? 'moderate' : 'long';
        responseText += `- **Sentences:** ${sentenceLength}, avg length ${Math.round(result.parameters.sentence.avg_length)} words\n`;
      }
      
      if (result.parameters.vocabulary) {
        responseText += `- **Vocabulary:** ${result.parameters.vocabulary.diversity < 0.4 ? 'limited' : 
          result.parameters.vocabulary.diversity < 0.6 ? 'moderately diverse' : 'highly diverse'}\n`;
        responseText += `- **Formality:** ${result.parameters.vocabulary.formality}\n`;
      }
      
      if (result.parameters.narrative) {
        responseText += `- **POV:** ${result.parameters.narrative.pov === 'first_person' ? 'first-person' : 
          result.parameters.narrative.pov === 'third_person' ? 'third-person' : 'mixed'}\n`;
        responseText += `- **Tense:** ${result.parameters.narrative.tense === 'present' ? 'present' : 
          result.parameters.narrative.tense === 'past' ? 'past' : 'mixed'}\n`;
      }
      
      if (result.parameters.tone && result.parameters.tone.emotional) {
        responseText += `- **Tone:** ${result.parameters.tone.emotional.join(', ')}\n`;
      }
    }
    
    if (result.comparable_authors && result.comparable_authors.length > 0) {
      responseText += `\n## Similar to these authors: ${result.comparable_authors.join(', ')}\n`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'write_in_style') {
    const result = await writeInStyle(args);
    
    let responseText = `# Writing Prompt\n\n`;
    responseText += `**Style:** ${result.profile_name}\n\n`;
    responseText += `**Prompt:** ${result.writing_prompt}\n\n`;
    
    if (result.length_instruction) {
      responseText += `**Length:** ${result.length_instruction}\n\n`;
    }
    
    if (result.style_guidance) {
      responseText += `## Style Guidance\n\n${result.style_guidance}\n\n`;
    }
    
    if (result.examples && result.examples.length > 0) {
      responseText += `## Example Passages\n\n`;
      result.examples.forEach(example => {
        responseText += `### ${example.title}\n\n${example.excerpt}\n\n`;
      });
    }
    
    responseText += `## Create your response following this style:`;
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  // =====================================================
  // NARRATIVE STRUCTURE TOOL HANDLERS
  // =====================================================

  if (name === 'get_character_journey') {
    const result = await getCharacterJourney(args);
    
    let responseText = `# Character Journey: ${result.character?.name || 'Unknown Character'}\n\n`;
    
    if (result.character?.role) {
      responseText += `**Role:** ${result.character.role}\n\n`;
    }
    
    responseText += `Found ${result.event_count} events in this character's journey.\n\n`;
    
    if (result.journey.length > 0) {
      responseText += `## Events\n\n`;
      
      result.journey.forEach(event => {
        responseText += `### ${event.title}\n`;
        
        if (event.importance) {
          responseText += `**Importance:** ${event.importance}/10 | `;
        }
        
        if (event.experience_type) {
          responseText += `**Experience:** ${event.experience_type}\n`;
        }
        
        if (event.description) {
          responseText += `\n${event.description}\n`;
        }
        
        if (event.notes) {
          responseText += `\n*Notes: ${event.notes}*\n`;
        }
        
        responseText += `\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'compare_character_journeys') {
    const result = await compareCharacterJourneys(args);
    
    let responseText = `# Character Journey Comparison\n\n`;
    responseText += `Found ${result.shared_events.length} shared events between ${result.journeys.length} characters.\n\n`;
    
    // List the characters being compared
    responseText += `## Characters\n\n`;
    result.journeys.forEach(journey => {
      responseText += `- **${journey.character.name}**: ${journey.event_count} total events\n`;
    });
    
    // List shared events
    if (result.shared_events.length > 0) {
      responseText += `\n## Shared Events\n\n`;
      
      result.shared_events.forEach(item => {
        responseText += `### ${item.event.title}\n\n`;
        
        if (item.event.description) {
          responseText += `${item.event.description}\n\n`;
        }
        
        responseText += `**Characters present:**\n`;
        item.characters.forEach(char => {
          responseText += `- ${char.name} (${char.experience_type}, importance: ${char.importance}/10)\n`;
        });
        
        responseText += `\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'update_event_sequence') {
    const result = await updateEventSequence(args);
    
    if (!result.success) {
      let responseText = `# Failed to Update Event Sequence\n\n`;
      responseText += `The update would violate existing dependencies.\n\n`;
      
      if (result.violations && result.violations.length > 0) {
        responseText += `## Dependency Violations\n\n`;
        
        result.violations.forEach(violation => {
          if (violation.type === 'successor_before_predecessor') {
            responseText += `- A successor event (${violation.successor_event_id}) would come before this event\n`;
          } else {
            responseText += `- A predecessor event (${violation.predecessor_event_id}) would come after this event\n`;
          }
        });
        
        responseText += `\nPlease choose a position that respects these dependencies.`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully updated event sequence from ${result.previous_sequence_number} to ${result.event.sequence_number}.`,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'normalize_event_sequence') {
    const result = await normalizeEventSequence(args);
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully normalized sequence numbers for ${result.events_normalized} events, starting at ${result.first_event?.new_sequence} and increasing by ${args.interval || 10} for each event.`,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'create_story_event') {
    const result = await createStoryEvent(args);
    
    let responseText = `# Event Created\n\n`;
    responseText += `Successfully created event "${result.event.title}".\n\n`;
    
    if (result.dependencies && result.dependencies.length > 0) {
      responseText += `Created ${result.dependencies.length} event dependencies.`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'add_event_with_dependencies') {
    const result = await addEventWithDependencies(args);
    
    let responseText = `# Event Created with Dependencies\n\n`;
    responseText += `Successfully created event "${result.event.title}" at sequence position ${result.event.sequence_number}.\n\n`;
    
    const predCount = args.predecessors?.length || 0;
    const succCount = args.successors?.length || 0;
    
    if (predCount > 0 || succCount > 0) {
      responseText += `Created dependencies with ${predCount} predecessor(s) and ${succCount} successor(s).`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'add_character_event') {
    const result = await addCharacterEvent(args);
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully created event "${result.event.title}" and added it to the character's journey.`,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'find_shared_events') {
    const result = await findSharedEvents(args);
    
    let responseText = `# Shared Events\n\n`;
    responseText += `Found ${result.total_events} events shared between selected characters.\n`;
    responseText += `${result.fully_shared_events} events are shared by all selected characters.\n\n`;
    
    if (result.events.length > 0) {
      responseText += `## Events\n\n`;
      
      result.events.forEach(event => {
        responseText += `### ${event.title}\n`;
        responseText += `Shared by ${event.shared_by} characters\n\n`;
        
        if (event.description) {
          responseText += `${event.description}\n\n`;
        }
        
        responseText += `**Characters:**\n`;
        event.characters.forEach(char => {
          responseText += `- ${char.name} (${char.experience_type || 'unspecified'}, importance: ${char.importance || '?'}/10)\n`;
        });
        
        responseText += `\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'add_scene_with_events') {
    const result = await addSceneWithEvents(args);
    
    let responseText = `# Scene Created\n\n`;
    responseText += `Successfully created scene "${result.scene.title}" linked to event "${result.event.title}".\n\n`;
    
    if (result.scene_characters && result.scene_characters.length > 0) {
      responseText += `Added ${result.scene_characters.length} characters to the scene.\n`;
    }
    
    if (result.scene_locations && result.scene_locations.length > 0) {
      responseText += `Added ${result.scene_locations.length} locations to the scene.\n`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'visualize_timeline') {
    const result = await visualizeTimeline(args);
    
    let responseText = `# Timeline Visualization\n\n`;
    
    if (result.type === 'structured') {
      responseText += `Generated timeline data with ${result.events.length} events and ${result.dependencies.length} dependencies.\n\n`;
      responseText += `Use this data with your preferred visualization tool.`;
    } else if (result.type === 'react-flow') {
      responseText += `Generated React Flow timeline with ${result.elements.nodes.length} nodes and ${result.elements.edges.length} edges.\n\n`;
      responseText += `Use this data with React Flow to visualize the timeline.`;
    } else {
      responseText += `Generated timeline data with ${result.items.length} events.\n\n`;
      responseText += `Use this data with a timeline visualization library.`;
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'analyze_event_impact') {
    const result = await analyzeEventImpact(args);
    
    let responseText = `# Event Impact Analysis: "${result.event.title}"\n\n`;
    
    // Basic event info
    if (result.event.description) {
      responseText += `${result.event.description}\n\n`;
    }
    
    // Impact summary
    responseText += `## Impact Summary\n\n`;
    responseText += `- **Characters Affected:** ${result.impact.character_count}\n`;
    responseText += `- **Causes:** ${result.impact.cause_count}\n`;
    responseText += `- **Effects:** ${result.impact.effect_count}\n`;
    responseText += `- **Scenes:** ${result.impact.scene_count}\n\n`;
    
    // Character impact
    responseText += `## Character Impact\n\n`;
    
    if (result.characters.primary.length > 0) {
      responseText += `### Primary Impact\n`;
      result.characters.primary.forEach(char => {
        responseText += `- **${char.name}** (${char.role || 'unspecified'})\n`;
      });
      responseText += `\n`;
    }
    
    if (result.characters.secondary.length > 0) {
      responseText += `### Secondary Impact\n`;
      result.characters.secondary.forEach(char => {
        responseText += `- **${char.name}** (${char.role || 'unspecified'})\n`;
      });
      responseText += `\n`;
    }
    
    // Causal relationships
    if (result.causes.length > 0) {
      responseText += `## Causes\n\n`;
      result.causes.forEach(cause => {
        responseText += `- **${cause.title}** (${cause.relationship}, strength: ${cause.strength}/10)\n`;
      });
      responseText += `\n`;
    }
    
    if (result.effects.length > 0) {
      responseText += `## Effects\n\n`;
      result.effects.forEach(effect => {
        responseText += `- **${effect.title}** (${effect.relationship}, strength: ${effect.strength}/10)\n`;
      });
      responseText += `\n`;
    }
    
    // Scenes
    if (result.scenes && result.scenes.length > 0) {
      responseText += `## Related Scenes\n\n`;
      result.scenes.forEach(scene => {
        responseText += `- ${scene.title}\n`;
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'detect_dependency_conflicts') {
    const result = await detectDependencyConflicts(args);
    
    let responseText = `# Dependency Conflict Analysis\n\n`;
    
    if (result.conflicts.length === 0) {
      responseText += `No dependency conflicts detected. The event sequence is logically consistent.`;
    } else {
      responseText += `Detected ${result.conflicts.length} potential conflicts in the event dependencies.\n\n`;
      
      responseText += `## Conflicts\n\n`;
      
      result.conflicts.forEach((conflict, index) => {
        responseText += `### Conflict ${index + 1}: `;
        
        if (conflict.type === 'sequence_conflict') {
          responseText += `Sequence Order Conflict\n\n`;
          responseText += `Event "${conflict.predecessor.title}" (sequence ${conflict.predecessor.sequence}) is defined as happening before `;
          responseText += `"${conflict.successor.title}" (sequence ${conflict.successor.sequence}), but its sequence number is higher.\n\n`;
          responseText += `**Suggestion:** Reorder these events or update the dependency relationship.\n\n`;
        } else if (conflict.type === 'circular_dependency') {
          responseText += `Circular Dependency\n\n`;
          responseText += `Detected a circular dependency involving these events:\n\n`;
          
          conflict.events.forEach((event, i) => {
            responseText += `${i+1}. "${event.title}" → `;
          });
          
          // Add the first event again to complete the circle
          if (conflict.events.length > 0) {
            responseText += `"${conflict.events[0].title}"\n\n`;
          }
          
          responseText += `**Suggestion:** Break the cycle by removing one of these dependencies.\n\n`;
        }
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'suggest_missing_events') {
    const result = await suggestMissingEvents(args);
    
    let responseText = `# Missing Event Suggestions\n\n`;
    
    if (result.suggestions.length === 0) {
      responseText += `No missing events detected. The story appears to have good continuity and logical progression.`;
    } else {
      responseText += `Found ${result.suggestions.length} potential gaps in the narrative that could benefit from additional events.\n\n`;
      
      responseText += `## Suggested Events\n\n`;
      
      result.suggestions.forEach((suggestion, index) => {
        responseText += `### Suggestion ${index + 1}: `;
        
        if (suggestion.type === 'sequence_gap') {
          responseText += `Narrative Gap\n\n`;
          responseText += `There's a large gap between "${suggestion.before_event.title}" and "${suggestion.after_event.title}".\n\n`;
          responseText += `**Suggested Event:** "${suggestion.suggested_event.title}"\n`;
          responseText += `${suggestion.suggested_event.description}\n\n`;
        } 
        else if (suggestion.type === 'causal_chain_gap') {
          responseText += `Causal Link Gap\n\n`;
          responseText += `The causal connection between "${suggestion.source_event.title}" and "${suggestion.target_event.title}" could benefit from an intermediate event.\n\n`;
          responseText += `**Suggested Event:** "${suggestion.suggested_event.title}"\n`;
          responseText += `${suggestion.suggested_event.description}\n\n`;
        }
        else if (suggestion.type === 'character_continuity_gap') {
          responseText += `Character Continuity Gap (${suggestion.character.name})\n\n`;
          responseText += `Character ${suggestion.character.name} disappears from the narrative between events "${suggestion.last_appearance.title}" and "${suggestion.next_appearance.title}".\n\n`;
          responseText += `**Suggested Event:** "${suggestion.suggested_event.title}"\n`;
          responseText += `${suggestion.suggested_event.description}\n\n`;
        }
      });
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  // =====================================================
  // ENTITY CREATION TOOL HANDLERS
  // =====================================================

  if (name === 'setup_story_world') {
    // Implementation would go here...
    return {
      content: [
        {
          type: "text",
          text: "Story world setup would be handled here.",
        }
      ],
    };
  }

  if (name === 'setup_series') {
    // Implementation would go here...
    return {
      content: [
        {
          type: "text",
          text: "Series setup would be handled here.",
        }
      ],
    };
  }

  // ... More entity creation tool handlers ...

  // =====================================================
  // SCENE MANAGEMENT TOOL HANDLERS
  // =====================================================

  if (name === 'import_scene') {
    const result = await importScene(args);
    
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'import_text') {
    const result = await importText(args);
    
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'create_scene_version') {
    const result = await createSceneVersion(args);
    
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'get_scene_versions') {
    const result = await getSceneVersions(args);
    
    let responseText = `# Scene Versions: "${result.scene.title}"\n\n`;
    responseText += `Retrieved ${result.versions.length} versions for this scene.\n\n`;
    
    if (result.versions.length > 0) {
      responseText += "## Version History\n\n";
      result.versions.forEach(version => {
        responseText += `### Version ${version.version_number}\n`;
        responseText += `- Created: ${new Date(version.created_at).toLocaleString()}\n`;
        if (version.notes) {
          responseText += `- Notes: ${version.notes}\n`;
        }
        responseText += `- Content Length: ${version.content.length} characters\n\n`;
      });
      
      responseText += "To view the content of a specific version or compare versions, use the appropriate tools.";
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'restore_scene_version') {
    const result = await restoreSceneVersion(args);
    
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'compare_scene_versions') {
    const result = await compareSceneVersions(args);
    
    let responseText = `# Version Comparison for "${result.scene_title}"\n\n`;
    responseText += `Comparing Version ${result.old_version.number} with Version ${result.new_version.number}.\n\n`;
    
    if (result.format === 'text') {
      responseText += "```diff\n" + result.comparison + "\n```";
    } else if (result.format === 'html') {
      responseText += "HTML diff output is available in the raw response.";
    } else {
      responseText += "JSON diff information is available in the raw response.";
    }
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'add_scene_comment') {
    const result = await addSceneComment(args);
    
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'resolve_scene_comment') {
    const result = await resolveSceneComment(args);
    
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'process_scene') {
    const result = await processScene(args);
    
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'address_scene_comments') {
    const result = await addressSceneComments(args);
    
    return {
      content: [
        {
          type: "text",
          text: result.message,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'export_project') {
    const result = await exportProject(args);
    
    let responseText = `# Export: "${result.story.title}"\n\n`;
    responseText += `Successfully exported ${result.scene_count} scenes in ${result.format} format.\n\n`;
    
    if (result.scene_count > 0) {
      responseText += "## Included Scenes\n";
      result.scenes.forEach((scene, index) => {
        responseText += `${index + 1}. ${scene.title}\n`;
      });
      responseText += "\n";
    }
    
    responseText += "The complete exported content is available in the raw response.";
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  if (name === 'export_fountain') {
    const result = await exportFountain(args);
    
    let responseText = `# Fountain Export: "${result.story.title}"\n\n`;
    responseText += `Successfully exported ${result.scene_count} scenes in Fountain format.\n\n`;
    
    if (result.scene_count > 0) {
      responseText += "## Included Scenes\n";
      result.scenes.forEach((scene, index) => {
        responseText += `${index + 1}. ${scene.title}\n`;
      });
      responseText += "\n";
    }
    
    responseText += "The complete exported Fountain screenplay is available in the raw response.";
    
    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
        {
          type: "json",
          json: result
        }
      ],
    };
  }

  // Default response if no matching tool
  return {
    content: [
      {
        type: "text",
        text: `Tool "${name}" not implemented or recognized.`,
      }
    ],
  };
});

// Start the server
server.run();

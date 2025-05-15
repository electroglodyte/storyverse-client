// scene-handlers.js
/**
 * Handler implementations for scene management tools
 */

// Import common dependencies
import { supabase } from '../database.js';

/**
 * Imports a new scene into the system
 */
export async function import_scene(args) {
  try {
    const {
      content,
      title,
      project_id, // Note: StoryVerse uses story_id
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
      content: [
        {
          type: "text",
          text: `Successfully imported scene "${sceneTitle}" into "${story.title}"`
        },
        {
          type: "json",
          json: {
            success: true,
            scene,
            version: version || null
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in import_scene:', error);
    throw error;
  }
}

/**
 * Imports and parses a full text into multiple scenes
 */
export async function import_text(args) {
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
      const result = await import_scene({
        content,
        title: 'Imported Text',
        project_id: story_id,
        type: 'scene',
        format: detectFormat(content)
      });
      
      scenes = [result.scene];
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully imported text as ${scenes.length} scene(s) into "${story.title}"`
        },
        {
          type: "json",
          json: {
            success: true,
            scenes,
            scene_count: scenes.length
          }
        }
      ]
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
      const regex = new RegExp(pattern); // Create a new regex to reset lastIndex
      while ((match = regex.exec(text)) !== null) {
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
 */
export async function create_scene_version(args) {
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
      content: [
        {
          type: "text",
          text: `Successfully created version ${nextVersionNumber} of scene "${scene.title}"`
        },
        {
          type: "json",
          json: {
            success: true,
            scene: updatedScene,
            version,
            previous_version: versions.length > 0 ? versions[0].version_number : null
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in create_scene_version:', error);
    throw error;
  }
}

/**
 * Retrieves version history for a scene
 */
export async function get_scene_versions(args) {
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
      content: [
        {
          type: "text",
          text: `Retrieved ${versions.length} versions for scene "${scene.title}"`
        },
        {
          type: "json",
          json: {
            success: true,
            scene,
            versions,
            version_count: versions.length,
            current_content: scene.content
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in get_scene_versions:', error);
    throw error;
  }
}

/**
 * Restores a scene to a previous version
 */
export async function restore_scene_version(args) {
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
      content: [
        {
          type: "text",
          text: `Successfully restored scene "${scene.title}" to version ${version.version_number}`
        },
        {
          type: "json",
          json: {
            success: true,
            scene: updatedScene,
            restored_version: version
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in restore_scene_version:', error);
    throw error;
  }
}

/**
 * Creates a detailed comparison between two scene versions
 */
export async function compare_scene_versions(args) {
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
      content: [
        {
          type: "text",
          text: `Comparison of versions ${oldVersion.version_number} and ${newVersion.version_number} of scene "${scene.title}"`
        },
        {
          type: format === 'html' ? "html" : "text",
          [format === 'html' ? "html" : "text"]: format === 'json' ? JSON.stringify(diff, null, 2) : diff
        },
        {
          type: "json",
          json: {
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
            format
          }
        }
      ]
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
  // Simple line-by-line diff for demonstration
  // In a real implementation, you'd use a diff library
  
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
 */
export async function add_scene_comment(args) {
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
      content: [
        {
          type: "text",
          text: `Successfully added ${type} to scene "${scene.title}"`
        },
        {
          type: "json",
          json: {
            success: true,
            comment
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in add_scene_comment:', error);
    throw error;
  }
}

/**
 * Marks a comment as resolved or unresolved
 */
export async function resolve_scene_comment(args) {
  try {
    const {
      comment_id,
      resolved = true
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
      content: [
        {
          type: "text",
          text: `Successfully marked comment as ${resolved ? 'resolved' : 'unresolved'} in "${sceneName}"`
        },
        {
          type: "json",
          json: {
            success: true,
            comment
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in resolve_scene_comment:', error);
    throw error;
  }
}

/**
 * Processes a scene according to instructions, creating a new version
 */
export async function process_scene(args) {
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
    const result = await create_scene_version({
      scene_id,
      content: processedContent,
      notes: `Processed with instructions: ${instructions}`
    });
    
    return {
      content: [
        {
          type: "text",
          text: `Successfully processed scene "${scene.title}" according to instructions`
        },
        {
          type: "json",
          json: {
            success: true,
            scene: result.content[1].json.scene,
            version: result.content[1].json.version,
            instructions
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in process_scene:', error);
    throw error;
  }
}

/**
 * Creates a new scene version that addresses specified comments
 */
export async function address_scene_comments(args) {
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
        content: [
          {
            type: "text",
            text: "No unresolved comments found to address"
          },
          {
            type: "json",
            json: {
              success: false,
              message: "No unresolved comments found to address"
            }
          }
        ]
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
    const result = await create_scene_version({
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
      content: [
        {
          type: "text",
          text: `Successfully addressed ${comments.length} comment(s) in scene "${scene.title}"`
        },
        {
          type: "json",
          json: {
            success: true,
            scene: result.content[1].json.scene,
            version: result.content[1].json.version,
            addressed_comments: comments.length,
            comment_ids: addressedComments
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in address_scene_comments:', error);
    throw error;
  }
}

/**
 * Exports a complete project as a single document
 */
export async function export_project(args) {
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
      content: [
        {
          type: "text",
          text: `Successfully exported ${scenes.length} scenes from "${story.title}"`
        },
        {
          type: "text",
          text: content
        },
        {
          type: "json",
          json: {
            success: true,
            story: {
              id: story.id,
              title: story.title
            },
            scenes: scenes.map(s => ({ id: s.id, title: s.title })),
            scene_count: scenes.length,
            format
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error in export_project:', error);
    throw error;
  }
}

/**
 * Exports scenes in Fountain format for screenplay formatting
 */
export async function export_fountain(args) {
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
      content: [
        {
          type: "text",
          text: `Successfully exported ${scenes.length} scenes in Fountain format from "${story.title}"`
        },
        {
          type: "text",
          text: content
        },
        {
          type: "json",
          json: {
            success: true,
            story: {
              id: story.id,
              title: story.title
            },
            scenes: scenes.map(s => ({ id: s.id, title: s.title })),
            scene_count: scenes.length
          }
        }
      ]
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
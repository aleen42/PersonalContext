import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILLS_DIR = path.resolve(__dirname, '../skills');
const INDEX_MD_PATH = path.join(SKILLS_DIR, 'index.md');

/**
 * Copy directory recursively
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, {recursive : true});
    const entries = fs.readdirSync(src, {withFileTypes : true});

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Remove directory recursively
 * @param {string} dir - Directory to remove
 */
function removeDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, {recursive : true, force : true});
    }
}

/**
 * Get skill name from SKILL.md
 * @param {string} skillDir - Path to skill directory
 * @returns {string|null} - Skill name or null
 */
function getSkillName(skillDir) {
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        // Try to extract title from first # heading
        const match = content.match(/^#\s+(.+)$/m);
        if (match) {
            return match[1].trim();
        }
    }
    return null;
}

/**
 * Update skill name in SKILL.md frontmatter with prefix
 * @param {string} skillDir - Path to skill directory
 * @param {string} prefix - Prefix to add to the name
 */
function updateSkillNameWithPrefix(skillDir, prefix) {
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
        let content = fs.readFileSync(skillMdPath, 'utf-8');
        // Update the name field in frontmatter by adding prefix
        content = content.replace(
            /^---\nname:\s*(.+?)\n/,
            (match, name) => `---\nname: ${prefix}-${name}\n`
        );
        fs.writeFileSync(skillMdPath, content);
    }
}

/**
 * Append external skills to skills/index.md
 * @param {Array<{name: string, displayName: string}>} skills - Skills to append
 * @param {string} prefix - Prefix to category
 */
function appendToIndexMd(skills, prefix) {
    const entries = skills.map(skill => `- [**${skill.displayName}**](./${skill.name}/SKILL.md)`);

    let content = '';
    if (fs.existsSync(INDEX_MD_PATH)) {
        content = `${fs.readFileSync(INDEX_MD_PATH, 'utf-8')}\n#### ${prefix.replace(/^[a-z]/, $0 => $0.toUpperCase())}\n\n`;
    }

    // Ensure file ends with newline
    if (!content.endsWith('\n')) {
        content += '\n';
    }

    // Append entries directly
    content += entries.join('\n') + '\n';

    fs.writeFileSync(INDEX_MD_PATH, content);
}

/**
 * Copy a single skill from source to target
 * @param {string} srcSkillDir - Source skill directory
 * @param {string} skillFolderName - Name for the skill folder
 * @param {string} prefix - Prefix to add to skill name in SKILL.md
 * @returns {{name: string, displayName: string}|null} - Skill info or null
 */
function copySingleSkill(srcSkillDir, skillFolderName, prefix) {
    const finalTargetDir = path.join(SKILLS_DIR, skillFolderName);

    // Remove existing target directory if it exists
    removeDir(finalTargetDir);

    // Copy the skill directory to target
    console.log(`Copying to ${finalTargetDir}...`);
    copyDir(srcSkillDir, finalTargetDir);

    // Update skill name in SKILL.md with prefix
    if (prefix) {
        updateSkillNameWithPrefix(finalTargetDir, prefix);
    }

    // Get skill name from SKILL.md
    return {
        name        : skillFolderName,
        displayName : getSkillName(finalTargetDir) || skillFolderName,
    };
}

/**
 * Copy a single file from source to target directory
 * @param {string} srcFilePath - Source file path
 * @param {string} targetDirName - Name for the target directory
 * @param {string} fileName - Name of the file to copy
 * @param {string} prefix - Prefix to add to directory name
 * @returns {{name: string, displayName: string}|null} - Skill info or null
 */
function copySingleFile(srcFilePath, targetDirName, fileName, prefix) {
    const finalTargetDir = path.join(SKILLS_DIR, targetDirName);
    const finalTargetFilePath = path.join(finalTargetDir, fileName);

    // Create target directory if non existed
    fs.existsSync(finalTargetDir) || fs.mkdirSync(finalTargetDir, {recursive : true});

    // Copy the file to target directory
    fs.copyFileSync(srcFilePath, finalTargetFilePath);

    // Update skill name in SKILL.md with prefix
    if (prefix) {
        updateSkillNameWithPrefix(finalTargetDir, prefix);
    }

    // For files, we use the directory name as display name
    return {
        name        : targetDirName,
        displayName : targetDirName,
    };
}

/**
 * Copy skill(s) from a git repository
 * @param {string} url - Git repository URL
 * @param {string|string[]} srcPath - Path(s) to skill directory or file (use 'skills/*' for all skills)
 * @param {string} prefix - Prefix for target directory name
 */
export default (url, srcPath, prefix) => {
    // Original single path logic (existing implementation)
    const TEMP_DIR = path.join(__dirname, '.temp-skills-repo');

    console.log(`Installing skills from ${url}...`);

    try {
        // Clean up any existing temp directory
        removeDir(TEMP_DIR);

        // Clone the repository
        console.log('Cloning repository...');
        execSync(`git clone --depth 1 --filter=blob:none --sparse ${url} ${TEMP_DIR}`, {
            stdio : 'inherit'
        });

        const copiedSkills = [];

        // Process each path in the array
        for (const singlePath of [].concat(srcPath)) {
            const isWildcard = singlePath.endsWith('/*');
            const isFile = !singlePath.endsWith('/') && !isWildcard && path.extname(singlePath) !== '';
            const basePath = isWildcard ? singlePath.slice(0, -2) : (isFile ? path.dirname(singlePath) : singlePath);

            // Checkout the skill directory(ies)
            console.log(`Extracting ${basePath}...`);
            execSync(`git -C ${TEMP_DIR} sparse-checkout set ${basePath}`, {
                stdio : 'inherit'
            });

            if (isWildcard) {
                // Copy all subdirectories from the base path
                const srcBaseDir = path.join(TEMP_DIR, basePath);
                if (fs.existsSync(srcBaseDir)) {
                    const entries = fs.readdirSync(srcBaseDir, {withFileTypes : true});
                    for (const entry of entries) {
                        if (entry.isDirectory()) {
                            const skillDir = path.join(srcBaseDir, entry.name);
                            const skillFolderName = prefix ? `${prefix}-${entry.name}` : entry.name;
                            const skillInfo = copySingleSkill(skillDir, skillFolderName, prefix);
                            if (skillInfo) {
                                copiedSkills.push(skillInfo);
                            }
                        }
                    }
                }
            } else if (isFile) {
                // Copy a single file
                const srcFilePath = path.join(TEMP_DIR, singlePath);
                const fileName = path.basename(singlePath);
                const skillName = path.basename(url).replace(/\.git$/, '');
                const targetDirName = prefix ? `${prefix}-${skillName}` : skillName;
                const skillInfo = copySingleFile(srcFilePath, targetDirName, fileName, prefix);
                if (skillInfo) {
                    copiedSkills.push(skillInfo);
                }
            } else {
                // Copy a single skill directory
                const srcSkillDir = path.join(TEMP_DIR, singlePath);
                const skillFolderName = prefix.includes('-') ? prefix : `${prefix}-${path.basename(singlePath)}`;
                const skillInfo = copySingleSkill(srcSkillDir, skillFolderName, prefix);
                if (skillInfo) {
                    copiedSkills.push(skillInfo);
                }
            }
        }

        // Append to index.md
        if (copiedSkills.length > 0) {
            console.log('Appending to skills/index.md...');
            appendToIndexMd(copiedSkills, prefix);
        }

        // Clean up temp directory
        console.log('Cleaning up...');
        removeDir(TEMP_DIR);

        console.log(`✓ ${copiedSkills.length} skill(s) installed successfully!`);
    } catch (error) {
        console.error('Error installing skills:', error.message);

        // Clean up on error
        removeDir(TEMP_DIR);

        process.exit(1);
    }
};

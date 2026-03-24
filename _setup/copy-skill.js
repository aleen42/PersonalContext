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
    const skillName = getSkillName(finalTargetDir);
    const displayName = skillName || skillFolderName;

    return {
        name : skillFolderName,
        displayName,
    };
}

/**
 * Copy skill(s) from a git repository
 * @param {string} url - Git repository URL
 * @param {string} srcPath - Path to skill directory (use 'skills/*' for all skills)
 * @param {string} prefix - Prefix for target directory name
 */
export default (url, srcPath, prefix = path.basename(srcPath)) => {
    const TEMP_DIR = path.join(__dirname, '.temp-skills-repo');
    const isWildcard = srcPath.endsWith('/*');
    const basePath = isWildcard ? srcPath.slice(0, -2) : srcPath;

    console.log(`Installing skills from ${url}...`);

    try {
        // Clean up any existing temp directory
        removeDir(TEMP_DIR);

        // Clone the repository
        console.log('Cloning repository...');
        execSync(`git clone --depth 1 --filter=blob:none --sparse ${url} ${TEMP_DIR}`, {
            stdio : 'inherit'
        });

        // Checkout the skill directory(ies)
        console.log(`Extracting ${srcPath} directory...`);
        execSync(`git -C ${TEMP_DIR} sparse-checkout set ${basePath}`, {
            stdio : 'inherit'
        });

        const copiedSkills = [];

        if (isWildcard) {
            // Copy all subdirectories from the base path
            const srcBaseDir = path.join(TEMP_DIR, basePath);
            if (fs.existsSync(srcBaseDir)) {
                const entries = fs.readdirSync(srcBaseDir, {withFileTypes : true});
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const skillDir = path.join(srcBaseDir, entry.name);
                        const skillFolderName = `${prefix}-${entry.name}`;
                        const skillInfo = copySingleSkill(skillDir, skillFolderName, prefix);
                        if (skillInfo) {
                            copiedSkills.push(skillInfo);
                        }
                    }
                }
            }
        } else {
            // Copy a single skill
            const srcSkillDir = path.join(TEMP_DIR, srcPath);
            const skillFolderName = prefix.includes('-') ? prefix : `${prefix}-${path.basename(srcPath)}`;
            const skillInfo = copySingleSkill(srcSkillDir, skillFolderName, prefix);
            if (skillInfo) {
                copiedSkills.push(skillInfo);
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

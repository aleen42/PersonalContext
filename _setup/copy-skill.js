import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SKILLS_DIR = path.resolve(__dirname, '../skills');
const INDEX_MD_PATH = path.join(SKILLS_DIR, 'index.md');
const prefixes = [];
generateIndexMd();

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

function isIgnored(relativePath) {
    try {
        execSync(`git check-ignore -q ${relativePath}`, {
            cwd   : ROOT_DIR,
            stdio : 'ignore',
        });
        return true;
    } catch (error) {
        return false;
    }
}

function formatCategoryName(categoryName) {
    return categoryName.replace(/^[a-z]/, character => character.toUpperCase());
}

function getExternalCategoryName(skillName) {
    const [, categoryName] = new RegExp(`^(${prefixes.map(RegExp.escape).join('|')})-`).exec(skillName) || [];
    return categoryName || 'others';
}

function buildIndexSection(skills) {
    return skills
        // language=markdown
        .map(skill => `- [**${skill.displayName}**](./${skill.name}/SKILL.md)`)
        .join('\n');
}

export function generateIndexMd() {
    const internalSkills = [];
    const externalSkillsByCategory = {};
    const entries = fs.readdirSync(SKILLS_DIR, {withFileTypes : true});

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const skillDir = path.join(SKILLS_DIR, entry.name);
        const skillMdPath = path.join(skillDir, 'SKILL.md');

        if (!fs.existsSync(skillMdPath)) {
            continue;
        }

        const skill = {
            name        : entry.name,
            displayName : getSkillName(skillDir) || entry.name,
        };

        if (!isIgnored(`skills/${entry.name}`)) {
            internalSkills.push(skill);
            continue;
        }

        const categoryName = getExternalCategoryName(entry.name);
        externalSkillsByCategory[categoryName] ||= [];
        externalSkillsByCategory[categoryName].push(skill);
    }

    internalSkills.sort((left, right) => left.displayName.localeCompare(right.displayName));
    Object.values(externalSkillsByCategory).forEach(skills => skills.sort((left, right) => left.displayName.localeCompare(right.displayName)));

    const externalCategories = Object.keys(externalSkillsByCategory)
        .sort((left, right) => {
            if (left === 'others') {
                return 1;
            }

            if (right === 'others') {
                return -1;
            }

            return left.localeCompare(right);
        })
        .map(categoryName => {
            const content = buildIndexSection(externalSkillsByCategory[categoryName]);
            // language=markdown // @formatter:off
            return `#### ${formatCategoryName(categoryName)}\n\n${content}`;
            // @formatter:on
        });

    // language=markdown // @formatter:off
    fs.writeFileSync(INDEX_MD_PATH, `
## Skills

### Internal

${buildIndexSection(internalSkills)}

### External

${externalCategories.join('\n\n')}

`); // @formatter:on
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

    prefixes.push(prefix);

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
        const addCopy = skillInfo => skillInfo
                                     && !copiedSkills.find(s => s.name === skillInfo.name)
                                     && copiedSkills.push(skillInfo);

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
                            addCopy(copySingleSkill(path.join(srcBaseDir, entry.name), prefix ? `${prefix}-${entry.name}` : entry.name, prefix));
                        }
                    }
                }
            } else if (isFile) {
                // Copy a single file
                const skillName = path.basename(url).replace(/\.git$/, '');
                addCopy(copySingleFile(path.join(TEMP_DIR, singlePath), prefix ? `${prefix}-${skillName}` : skillName, path.basename(singlePath), prefix))
            } else {
                // Copy a single skill directory
                addCopy(copySingleSkill(path.join(TEMP_DIR, singlePath), prefix.includes('-') ? prefix : `${prefix}-${path.basename(singlePath)}`, prefix));
            }
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

import copySkill from './copy-skill.js';

copySkill('https://github.com/anthropics/skills.git', 'skills/skill-creator', 'anthropics'); // anthropics-*
copySkill('https://github.com/obra/superpowers.git', 'skills/*', 'superpowers'); // superpowers-*

// who-is-actor
copySkill('https://github.com/Wscats/who-is-actor.git', ['skill.yaml', 'SKILL.md'], '');

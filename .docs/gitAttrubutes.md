# Git Attributes Configuration for SMNB

## Overview

The `.gitattributes` file in the SMNB project root ensures consistent cross-platform development, accurate language detection on GitHub, and optimized Git operations for our TypeScript/Next.js/Convex stack.

## Key Benefits

### 🔄 Cross-Platform Consistency
- **Line Ending Normalization**: Forces LF (`\n`) line endings for all text files across Windows, macOS, and Linux
- **Prevents "Entire File Changed" Issues**: Eliminates spurious diffs caused by line ending differences
- **Team Collaboration**: Ensures consistent behavior regardless of team member's operating system

### 🎯 Accurate GitHub Language Detection
- **Primary Languages**: Correctly identifies TypeScript and JavaScript as main languages
- **Generated File Exclusion**: Excludes lock files and auto-generated code from language statistics
- **Repository Classification**: Helps GitHub properly categorize the SMNB project

### 📊 Enhanced Diff & PR Experience
- **Noise Reduction**: Marks generated files to reduce clutter in pull requests
- **Specialized Algorithms**: Uses optimized diff algorithms for markdown, JSON, and CSS files
- **Focused Reviews**: Makes code reviews more efficient by highlighting actual changes

## File Structure & Rules

### Text Files with LF Normalization
```gitattributes
# Core development files
*.ts text eol=lf          # TypeScript source files
*.tsx text eol=lf         # React TypeScript components
*.js text eol=lf          # JavaScript files
*.jsx text eol=lf         # React JavaScript components
*.json text eol=lf        # Configuration and data files
*.md text eol=lf          # Documentation files
*.css text eol=lf         # Stylesheets
```

### Next.js Specific Configurations
```gitattributes
next.config.js text eol=lf
next.config.mjs text eol=lf
next.config.ts text eol=lf    # TypeScript Next.js config
next-env.d.ts text eol=lf     # Next.js TypeScript declarations
```

### Convex Backend Integration
```gitattributes
convex.json text eol=lf                    # Convex configuration
convex/*.ts text eol=lf                    # Convex functions and schema
convex/_generated/* linguist-generated=true # Auto-generated Convex files
```

**Convex Benefits:**
- Ensures consistent line endings in database functions and schemas
- Excludes auto-generated API files from language statistics
- Maintains clean diffs for backend development

### Package Management
```gitattributes
package.json text eol=lf
pnpm-lock.yaml text eol=lf linguist-generated=true
yarn.lock text eol=lf linguist-generated=true
package-lock.json text eol=lf linguist-generated=true
```

**Benefits:**
- Consistent package.json formatting across environments
- Marks lock files as generated to reduce PR noise
- Prevents merge conflicts in dependency files

### Build Outputs & Generated Files
```gitattributes
.next/* linguist-generated=true           # Next.js build output
out/* linguist-generated=true             # Export output
dist/* linguist-generated=true            # Distribution files
build/* linguist-generated=true           # Build artifacts
*.map binary linguist-generated=true      # Source maps
```

### Binary File Handling
```gitattributes
# Images
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.webp binary

# Fonts
*.ttf binary
*.woff binary
*.woff2 binary
```

## SMNB-Specific Optimizations

### Live Feed Components
- **Consistent Formatting**: All TypeScript components in `components/livefeed/` use LF line endings
- **Documentation**: Markdown files in component directories use specialized diff algorithms
- **Type Definitions**: Enhanced Reddit post types maintain consistent formatting

### Multi-Agent Architecture
- **Service Files**: All files in `lib/services/` follow consistent line ending rules
- **Store Definitions**: Zustand stores maintain proper formatting across platforms
- **Type Safety**: TypeScript interfaces and types are consistently formatted

### Analytics & Dashboard
- **Component Consistency**: Dashboard components maintain uniform line endings
- **Configuration Files**: Tailwind, PostCSS, and ESLint configs are properly normalized
- **Build Process**: Optimization for analytics bundle generation

## Implementation Guide

### Initial Setup
1. **File Creation**: The `.gitattributes` file is placed in project root
2. **Immediate Effect**: New files automatically follow the rules
3. **Existing Files**: Use normalization command for current repository

### Applying to Existing Files
```bash
# Normalize all existing files (one-time operation)
git add --renormalize .
git commit -m "Normalize line endings using .gitattributes"
```

### Team Onboarding
When new team members join:
1. They pull the repository with `.gitattributes` already configured
2. Git automatically applies rules to their local working directory
3. No additional configuration required

## Export & Archive Optimization

### Excluded from Exports
```gitattributes
.github export-ignore         # GitHub workflows
.vscode export-ignore         # VS Code settings
tests export-ignore           # Test files
*.test.ts export-ignore       # Unit tests
*.spec.ts export-ignore       # Specification tests
.env.example export-ignore    # Environment examples
```

**Benefits:**
- Cleaner distribution packages
- Reduced archive sizes
- Production-ready exports

## Monitoring & Maintenance

### Language Statistics
- **GitHub Insights**: Check repository language breakdown remains accurate
- **Generated File Growth**: Monitor that new generated files are properly marked
- **Documentation Ratio**: Ensure docs are properly categorized

### Diff Quality
- **PR Reviews**: Verify that generated files don't clutter pull requests
- **Merge Conflicts**: Reduced conflicts due to line ending consistency
- **File History**: Cleaner git blame and history views

## Best Practices

### For Developers
1. **Trust the System**: Git automatically handles line endings based on the rules
2. **Commit Frequently**: Changes are automatically normalized on commit
3. **Review PRs**: Focus on actual code changes, not formatting differences

### For Project Maintenance
1. **Regular Updates**: Review `.gitattributes` when adding new file types
2. **Team Communication**: Notify team of any major changes to the configuration
3. **Documentation**: Keep this documentation updated with rule changes

## Troubleshooting

### Common Issues
- **Mixed Line Endings**: Run `git add --renormalize .` to fix
- **Large Diffs**: Check if new generated files need `linguist-generated` attribute
- **Language Detection**: Verify new file types have appropriate language attributes

### Verification
```bash
# Check line endings in a file
git ls-files --eol

# See which attributes apply to a file
git check-attr -a <filename>
```

## Integration with SMNB Architecture

This `.gitattributes` configuration supports:
- **Convex Real-time Database**: Consistent backend function formatting
- **Next.js App Router**: Proper handling of route and component files
- **TypeScript Strictness**: Maintains type safety across platforms
- **Live Feed Pipeline**: Ensures agent and service files remain consistent
- **Multi-Platform Development**: Seamless collaboration across different operating systems

The configuration is specifically tailored for the SMNB project's sophisticated multi-agent processing pipeline and real-time content curation system, ensuring that all team members can contribute effectively regardless of their development environment.
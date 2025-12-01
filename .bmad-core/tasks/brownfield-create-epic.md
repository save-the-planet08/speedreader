<!-- Powered by BMAD™ Core -->

# Create Brownfield Epic Task

## Purpose

Create a single epic for smaller brownfield enhancements that don't require the full PRD and Architecture documentation process. This task is for isolated features or modifications that can be completed within a focused scope.

## When to Use This Task

**Use this task when:**

- The enhancement can be completed in 1-3 stories
- No significant architectural changes are required
- The enhancement follows existing project patterns
- Integration complexity is minimal
- Risk to existing system is low

**Use the full brownfield PRD/Architecture process when:**

- The enhancement requires multiple coordinated stories
- Architectural planning is needed
- Significant integration work is required
- Risk assessment and mitigation planning is necessary

## Instructions

### 1. Project Analysis (Required)

Before creating the epic, gather essential information about the existing project:

**Existing Project Context:**

- [ ] Project purpose and current functionality understood
- [ ] Existing technology stack identified
- [ ] Current architecture patterns noted
- [ ] Integration points with existing system identified

**Enhancement Scope:**

- [ ] Enhancement clearly defined and scoped
- [ ] Impact on existing functionality assessed
- [ ] Required integration points identified
- [ ] Success criteria established

### 2. Epic Creation

Create a focused epic following this structure:

#### Epic Title

{{Enhancement Name}} - Brownfield Enhancement

#### Epic Goal

{{1-2 sentences describing what the epic will accomplish and why it adds value}}

#### Epic Description

**CRITICAL: Read ALL Project Context First**

Before creating this epic, you MUST read and understand the complete project context:

**Required Reading (MANDATORY):**
- All CLAUDE.md files throughout the project structure for development patterns and conventions
- All PRPs/*.md files for project requirements and architecture documentation
- `.bmad-core/core-config.yaml` for project configuration and workflow settings
- Any existing status reports in `PRPs/ai_docs/reports/` to understand previous work and decisions
- Project-specific documentation files (backend/database/CLAUDE.MD, backend/agents/CLAUDE.MD, etc.)

**External Knowledge Sources (MANDATORY):**
- **Supabase MCP Documentation**: Access through configured MCP server for database operations
- **Archon Documentation**: Available through Archon Docker containers for task management patterns
- **Relevant API Documentation**: For any external services being integrated (OpenAI, etc.)
- **Framework Documentation**: For technology stack being used (Supabase, React, etc.)

**Existing System Context:**

- Current relevant functionality: {{brief description}}
- Technology stack: {{relevant existing technologies}}
- Integration points: {{where new work connects to existing system}}

**Enhancement Details:**

- What's being added/changed: {{clear description}}
- How it integrates: {{integration approach}}
- Success criteria: {{measurable outcomes}}

#### Stories

List 1-3 focused stories that complete the epic:

1. **Story 1:** {{Story title and brief description}}
2. **Story 2:** {{Story title and brief description}}
3. **Story 3:** {{Story title and brief description}}

#### Compatibility Requirements

- [ ] Existing APIs remain unchanged
- [ ] Database schema changes are backward compatible
- [ ] UI changes follow existing patterns
- [ ] Performance impact is minimal

#### Risk Mitigation

- **Primary Risk:** {{main risk to existing system}}
- **Mitigation:** {{how risk will be addressed}}
- **Rollback Plan:** {{how to undo changes if needed}}

#### Definition of Done

- [ ] All stories completed with acceptance criteria met
- [ ] Existing functionality verified through testing
- [ ] Integration points working correctly
- [ ] Documentation updated appropriately
- [ ] No regression in existing features

### 3. Validation Checklist

Before finalizing the epic, ensure:

**Scope Validation:**

- [ ] Epic can be completed in 1-3 stories maximum
- [ ] No architectural documentation is required
- [ ] Enhancement follows existing patterns
- [ ] Integration complexity is manageable

**Risk Assessment:**

- [ ] Risk to existing system is low
- [ ] Rollback plan is feasible
- [ ] Testing approach covers existing functionality
- [ ] Team has sufficient knowledge of integration points

**Completeness Check:**

- [ ] Epic goal is clear and achievable
- [ ] Stories are properly scoped
- [ ] Success criteria are measurable
- [ ] Dependencies are identified

### 4. Handoff to Story Manager

Once the epic is validated, provide this handoff to the Story Manager:

---

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running {{technology stack}}
- Integration points: {{list key integration points}}
- Existing patterns to follow: {{relevant existing patterns}}
- Critical compatibility requirements: {{key requirements}}
- Each story must include verification that existing functionality remains intact

The epic should maintain system integrity while delivering {{epic goal}}."

---

### 5. Post-Epic Status Report

**MANDATORY**: After completing all epic stories, automatically execute the epic completion status report:

**Status Report Integration:**

- [ ] All epic stories completed
- [ ] Execute status report command: `/Users/frederikpietratus/nanoflea/.claude/commands/status-report.md`
- [ ] Report purpose: "Epic: {{Epic Title}} completion"
- [ ] Include all technical changes across all stories, validation results, and integration testing
- [ ] Save to: `PRPs/ai_docs/reports/YYYY-MM-DD_{{epic-name}}_epic-completion_status.md`

**Epic Status Report Requirements:**

- Document all files modified across all stories in the epic
- Record comprehensive functionality testing results
- Note all integration points verified and working
- Capture any issues or blockers encountered during epic implementation
- Define next epic priorities or follow-up work needed
- Provide comprehensive context for future development handoff

---

## Success Criteria

The epic creation is successful when:

1. Enhancement scope is clearly defined and appropriately sized
2. Integration approach respects existing system architecture
3. Risk to existing functionality is minimized
4. Stories are logically sequenced for safe implementation
5. Compatibility requirements are clearly specified
6. Rollback plan is feasible and documented
7. **Post-epic status report generation is automatically included in final story**

## Important Notes

- This task is specifically for SMALL brownfield enhancements
- If the scope grows beyond 3 stories, consider the full brownfield PRD process
- Always prioritize existing system integrity over new functionality
- When in doubt about scope or complexity, escalate to full brownfield planning
- **Status report generation is mandatory after each individual story AND after epic completion**
- **All project context must be read before starting any story implementation**

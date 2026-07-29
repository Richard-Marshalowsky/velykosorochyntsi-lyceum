# Requirements Document

## Introduction

This document specifies the requirements for a WYSIWYG (What You See Is What You Get) visual content editor for the Velykosorochyntsi Lyceum website. The feature enables authenticated administrators to edit text content directly on the website by clicking on it, with visual formatting tools, persistent storage in Supabase, and real-time synchronization across all pages.

## Glossary

- **WYSIWYG_Editor**: The visual content editing system that allows inline editing with formatting toolbar
- **Edit_Mode**: A state where administrators can click and edit text content on the website
- **Formatting_Toolbar**: A visual toolbar providing text formatting options (bold, italic, font size, color, alignment)
- **Content_Store**: Supabase database table storing edited content with keys and values
- **Admin_User**: An authenticated user with role 'admin', 'super_admin', or 'editor'
- **Editable_Element**: Any text element on the website that can be edited in Edit_Mode
- **Content_Key**: A unique identifier for each editable element composed of page path and element index
- **Session**: An authenticated user's login session verified through Supabase Auth
- **Sync_Operation**: The process of updating content across all pages when shared elements are modified

## Requirements

### Requirement 1: Authentication and Authorization

**User Story:** As a website administrator, I want only authenticated admins to access editing capabilities, so that unauthorized users cannot modify website content.

#### Acceptance Criteria

1. WHEN the WYSIWYG_Editor initializes, THE System SHALL verify the current Session with Supabase Auth
2. IF no valid Session exists, THEN THE WYSIWYG_Editor SHALL hide all editing controls and remain inactive
3. WHEN a valid Session exists, THE WYSIWYG_Editor SHALL query the admin_users table for the user's role
4. IF the Admin_User role is 'admin', 'super_admin', or 'editor', THEN THE WYSIWYG_Editor SHALL enable editing capabilities
5. IF the Admin_User role is not one of the authorized roles, THEN THE WYSIWYG_Editor SHALL remain inactive

### Requirement 2: Edit Mode Toggle

**User Story:** As an administrator, I want to toggle between viewing and editing modes, so that I can browse the site normally or enter editing mode when needed.

#### Acceptance Criteria

1. WHEN an authorized Admin_User is authenticated, THE WYSIWYG_Editor SHALL display an "Enter Edit Mode" toggle button
2. WHEN the Admin_User clicks the toggle button, THE System SHALL activate Edit_Mode
3. WHILE Edit_Mode is active, THE System SHALL apply visual indicators to all Editable_Elements (outline, highlight, or border)
4. WHILE Edit_Mode is active, THE toggle button SHALL display "Exit Edit Mode" text
5. WHEN the Admin_User clicks the toggle button while in Edit_Mode, THE System SHALL deactivate Edit_Mode and remove visual indicators
6. WHILE Edit_Mode is inactive, THE System SHALL prevent editing of Editable_Elements

### Requirement 3: Editable Element Detection

**User Story:** As an administrator, I want the system to automatically detect all text content on the page, so that I can edit any text without manual configuration.

#### Acceptance Criteria

1. WHEN the WYSIWYG_Editor initializes, THE System SHALL scan the page for text-containing elements (headings, paragraphs, list items, table cells, spans)
2. THE System SHALL exclude elements within navigation menus, footers, and the editing toolbar itself
3. THE System SHALL assign a unique Content_Key to each detected Editable_Element based on page path and element index
4. WHEN multiple elements contain the same text content, THE System SHALL treat them as separate Editable_Elements with unique Content_Keys
5. THE System SHALL store Content_Keys as data attributes on Editable_Elements for later reference

### Requirement 4: Inline Content Editing

**User Story:** As an administrator, I want to click on any text element to edit it inline, so that I can see my changes in context immediately.

#### Acceptance Criteria

1. WHILE Edit_Mode is active, WHEN an Admin_User clicks on an Editable_Element, THE System SHALL make that element editable with contentEditable="true"
2. WHEN an Editable_Element becomes editable, THE System SHALL focus the cursor at the click position
3. WHILE an element is being edited, THE Admin_User SHALL be able to type, delete, and modify text freely
4. WHEN an Admin_User clicks outside an editable element, THE System SHALL maintain the changes in the element
5. THE System SHALL preserve all changes in memory until explicitly saved by the Admin_User

### Requirement 5: Formatting Toolbar Display

**User Story:** As an administrator, I want a visual formatting toolbar to appear when editing text, so that I can apply formatting without remembering keyboard shortcuts.

#### Acceptance Criteria

1. WHEN an Editable_Element receives focus in Edit_Mode, THE System SHALL display the Formatting_Toolbar near the element
2. THE Formatting_Toolbar SHALL contain buttons for: bold, italic, underline, strikethrough, font size increase, font size decrease, text color picker, highlight color picker, left align, center align, right align, and justify align
3. THE Formatting_Toolbar SHALL remain visible while the Editable_Element has focus
4. WHEN the Admin_User clicks a formatting button, THE System SHALL apply the corresponding formatting to the selected text or cursor position
5. WHEN the Admin_User clicks outside the Editable_Element, THE Formatting_Toolbar SHALL hide

### Requirement 6: Text Formatting Application

**User Story:** As an administrator, I want to apply visual formatting to text, so that I can emphasize content and improve readability.

#### Acceptance Criteria

1. WHEN an Admin_User selects text and clicks the bold button, THE System SHALL wrap the selected text in strong tags or apply font-weight CSS
2. WHEN an Admin_User selects text and clicks the italic button, THE System SHALL wrap the selected text in em tags or apply font-style CSS
3. WHEN an Admin_User selects text and clicks the underline button, THE System SHALL apply text-decoration underline CSS
4. WHEN an Admin_User selects text and clicks the strikethrough button, THE System SHALL apply text-decoration line-through CSS
5. WHEN an Admin_User clicks the font size increase button, THE System SHALL increase the selected text font size by 2px
6. WHEN an Admin_User clicks the font size decrease button, THE System SHALL decrease the selected text font size by 2px
7. WHEN an Admin_User selects a color from the text color picker, THE System SHALL apply that color to the selected text
8. WHEN an Admin_User selects a color from the highlight color picker, THE System SHALL apply that background color to the selected text
9. WHEN an Admin_User clicks an alignment button (left, center, right, justify), THE System SHALL apply that text alignment to the entire Editable_Element

### Requirement 7: Content Persistence

**User Story:** As an administrator, I want my content changes to be saved to the database, so that they persist across page reloads and are visible to all site visitors.

#### Acceptance Criteria

1. WHILE Edit_Mode is active, THE WYSIWYG_Editor SHALL display a "Save Changes" button
2. WHEN an Admin_User clicks the "Save Changes" button, THE System SHALL collect all modified Editable_Elements and their Content_Keys
3. FOR ALL modified Editable_Elements, THE System SHALL extract the innerHTML content
4. THE System SHALL send an upsert request to the site_content table in Content_Store with key, page, value (innerHTML), and updated_by (admin email)
5. WHEN the Content_Store returns a success response, THE System SHALL display a success notification to the Admin_User
6. IF the Content_Store returns an error response, THEN THE System SHALL display an error notification with the error message

### Requirement 8: Content Loading on Page Load

**User Story:** As a website visitor, I want to see the most recent saved content when I visit the site, so that I always view up-to-date information.

#### Acceptance Criteria

1. WHEN a page loads, THE WYSIWYG_Editor SHALL query the Content_Store for all content entries matching the current page path
2. FOR ALL returned content entries, THE System SHALL find the Editable_Element with the matching Content_Key
3. WHEN a matching Editable_Element is found, THE System SHALL replace its innerHTML with the stored value from Content_Store
4. WHEN no matching Editable_Element is found, THE System SHALL ignore that content entry
5. THE System SHALL complete content loading before displaying the page to users to prevent content flickering

### Requirement 9: Cross-Page Content Synchronization

**User Story:** As an administrator, I want changes to shared content elements (like footer contact info) to update across all pages, so that I don't need to edit the same content multiple times.

#### Acceptance Criteria

1. WHEN an Admin_User saves changes to an Editable_Element, THE System SHALL identify if the element appears on multiple pages based on similar content structure and position
2. FOR ALL pages containing the same structural element, THE System SHALL update the Content_Store with the new value using the same Content_Key pattern
3. WHEN a user visits any page containing the synchronized element, THE System SHALL load the updated content from Content_Store
4. THE System SHALL synchronize content for footer elements, header elements, and contact information blocks across all pages
5. THE System SHALL treat unique page-specific content as isolated and not synchronize it across pages

### Requirement 10: Visual Feedback and Indicators

**User Story:** As an administrator, I want clear visual feedback about what is editable and the current editing state, so that I can easily identify which content I can modify.

#### Acceptance Criteria

1. WHILE Edit_Mode is active, THE System SHALL apply a 2-pixel dashed outline to all Editable_Elements
2. WHEN an Editable_Element is being actively edited, THE System SHALL change the outline color to indicate focus state
3. WHILE content is being saved, THE "Save Changes" button SHALL display "Saving..." text and be disabled
4. WHEN content save completes successfully, THE System SHALL display a success message for 3 seconds
5. WHEN content save fails, THE System SHALL display an error message that remains visible until dismissed by the Admin_User

### Requirement 11: Edit Mode State Persistence

**User Story:** As an administrator, I want Edit Mode to remain active as I navigate between pages during an editing session, so that I can efficiently edit content across multiple pages.

#### Acceptance Criteria

1. WHEN an Admin_User activates Edit_Mode, THE System SHALL store the Edit_Mode state in sessionStorage
2. WHEN the Admin_User navigates to another page, THE System SHALL check sessionStorage for Edit_Mode state
3. IF Edit_Mode state is active in sessionStorage, THEN THE WYSIWYG_Editor SHALL automatically activate Edit_Mode on the new page
4. WHEN an Admin_User explicitly exits Edit_Mode, THE System SHALL remove the Edit_Mode state from sessionStorage
5. WHEN the browser session ends, THE System SHALL clear the Edit_Mode state

### Requirement 12: Formatting Toolbar Positioning

**User Story:** As an administrator, I want the formatting toolbar to be positioned conveniently near the text I'm editing, so that I can easily access formatting options.

#### Acceptance Criteria

1. WHEN an Editable_Element receives focus, THE System SHALL calculate the position of the Formatting_Toolbar to appear above the element
2. IF there is insufficient space above the element, THEN THE System SHALL position the Formatting_Toolbar below the element
3. THE Formatting_Toolbar SHALL be horizontally centered relative to the Editable_Element
4. IF the Editable_Element is wider than the toolbar, THE Formatting_Toolbar SHALL align to the left edge of the element
5. THE Formatting_Toolbar SHALL remain fixed in position while the element is being edited and not follow the scroll position

### Requirement 13: Security and Input Sanitization

**User Story:** As a system administrator, I want all user input to be sanitized before storage, so that malicious scripts cannot be injected into the website.

#### Acceptance Criteria

1. WHEN an Admin_User saves edited content, THE System SHALL sanitize the HTML content to remove dangerous tags (script, iframe, object, embed)
2. THE System SHALL preserve safe HTML tags (strong, em, span, div, p, h1-h6, ul, ol, li, br, a) that are commonly used for formatting
3. THE System SHALL remove event handler attributes (onclick, onload, onerror) from all HTML elements
4. THE System SHALL encode special characters in href and src attributes to prevent XSS attacks
5. WHEN malicious content is detected and removed, THE System SHALL log a warning but still save the sanitized content

### Requirement 14: Undo and Redo Functionality

**User Story:** As an administrator, I want to undo and redo my editing changes, so that I can easily correct mistakes without reloading the page.

#### Acceptance Criteria

1. WHILE an Editable_Element is being edited, THE System SHALL track all changes in a history stack
2. WHEN an Admin_User presses Ctrl+Z (or Cmd+Z on Mac), THE System SHALL undo the last change
3. WHEN an Admin_User presses Ctrl+Y (or Cmd+Shift+Z on Mac), THE System SHALL redo the previously undone change
4. THE System SHALL maintain an undo history of up to 50 changes per Editable_Element
5. WHEN an Admin_User starts editing a different element, THE System SHALL preserve the undo history for the previous element

### Requirement 15: Mobile Responsiveness

**User Story:** As an administrator using a mobile device, I want the editing interface to work on touch screens, so that I can edit content from my phone or tablet.

#### Acceptance Criteria

1. WHEN an Admin_User accesses the site on a device with screen width less than 768 pixels, THE Formatting_Toolbar SHALL display in a compact vertical layout
2. WHEN an Admin_User taps an Editable_Element on a touch device, THE System SHALL make it editable and display the Formatting_Toolbar
3. THE Formatting_Toolbar buttons SHALL have touch-friendly sizes (minimum 44x44 pixels) on mobile devices
4. WHEN the on-screen keyboard appears, THE System SHALL adjust the Formatting_Toolbar position to remain visible
5. THE toggle Edit_Mode button SHALL be accessible and visible on mobile devices without requiring horizontal scrolling

### Requirement 16: Special Element Handling

**User Story:** As an administrator, I want links and phone numbers to update automatically when I edit contact information, so that clickable elements remain functional.

#### Acceptance Criteria

1. WHEN an Admin_User edits text within an anchor tag with href starting with "tel:", THE System SHALL update the href attribute to match the edited phone number
2. WHEN an Admin_User edits text within an anchor tag with href starting with "mailto:", THE System SHALL update the href attribute to match the edited email address
3. THE System SHALL strip all non-numeric characters from phone numbers when updating tel: links
4. THE System SHALL trim whitespace from email addresses when updating mailto: links
5. WHEN an Admin_User saves changes, THE System SHALL apply these special link updates before sending data to Content_Store

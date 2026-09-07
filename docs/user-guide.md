# User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Equipment Management](#equipment-management)
5. [Borrow System](#borrow-system)
6. [Maintenance Management](#maintenance-management)
7. [AI Assistant](#ai-assistant)
8. [Reporting and Statistics](#reporting-and-statistics)
9. [User Roles and Permissions](#user-roles-and-permissions)
10. [Troubleshooting](#troubleshooting)

## Introduction

Welcome to the Laboratory Equipment Management System with AI Integration (AI-LEMS). This guide will help you understand how to use the system effectively for managing laboratory equipment, borrowing items, tracking maintenance, and getting AI-powered assistance.

## Getting Started

### System Access

1. **Web Application**: Open your web browser and navigate to the system URL
2. **Mobile Access**: The system is responsive and works on mobile devices
3. **API Access**: Developers can access the REST API for integration

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection (for AI features)

### First Time Login

1. Use your assigned credentials to log in
2. Change your password after first login
3. Review your profile information
4. Explore the system interface

## Authentication

### Login Process

1. Enter your username and password
2. Click "Login" button
3. You will be redirected to the dashboard

### Password Management

- **Change Password**: Navigate to Profile > Settings > Change Password
- **Reset Password**: Click "Forgot Password" on login page
- **Password Requirements**: Minimum 8 characters, include uppercase, lowercase, numbers, and special characters

### Session Management

- Sessions timeout after 30 minutes of inactivity
- "Remember Me" option available for trusted devices
- Logout when using shared computers

## Equipment Management

### Equipment Catalog

The equipment catalog displays all available laboratory equipment with the following information:

- Equipment name and description
- Group and location
- Current status (Available, Borrowed, Maintenance)
- Last updated date

### Search and Filter

- **Search**: Use the search bar to find equipment by name or description
- **Filter by Group**: Select equipment groups (Test Equipment, Measurement Tools, etc.)
- **Filter by Location**: Select specific laboratories or storage areas

### Equipment Details

Click on any equipment item to view detailed information:

- Complete equipment specifications
- Current status and location
- Borrow history
- Maintenance records
- Associated documents

### Adding New Equipment

1. Navigate to Equipment > Add Equipment
2. Fill in the required fields:
   - Equipment name
   - Description
   - Group (select from predefined list)
   - Location (select from predefined list)
3. Click "Save" to add the equipment

### Editing Equipment

1. Find the equipment in the catalog
2. Click "Edit" button
3. Modify the required fields
4. Click "Save" to update

### Equipment Status Management

Equipment can have one of three statuses:

- **Available**: Equipment is ready for borrowing
- **Borrowed**: Equipment is currently in use
- **Maintenance**: Equipment is under maintenance

Status changes are automatically managed by the system when:
- Equipment is borrowed or returned
- Maintenance is scheduled or completed

## Borrow System

### Creating a Borrow Request

1. Navigate to Borrow > New Request
2. Select the equipment you want to borrow
3. Fill in the request details:
   - Purpose of borrowing
   - Start date and time
   - End date and time
4. Click "Submit Request"

### Borrow Request Status

Borrow requests go through the following lifecycle:

1. **Pending**: Awaiting approval
2. **Approved**: Request approved, equipment available
3. **Rejected**: Request denied by manager
4. **Returned**: Equipment has been returned

### Viewing Borrow Requests

- **My Requests**: View requests you have submitted
- **All Requests**: View all requests (manager only)
- **Active Requests**: View currently active borrowings

### Approving/Rejecting Requests

Managers can approve or reject borrow requests:

1. Navigate to Borrow > Pending Requests
2. Select a request to review
3. Click "Approve" or "Reject"
4. Add comments if rejecting

### Returning Equipment

1. Navigate to Borrow > My Active Loans
2. Find the equipment you want to return
3. Click "Return" button
4. Confirm the return

### Borrow Rules

- Equipment must be available before a new request can be created
- Borrow duration is limited to 14 days
- Requests must be approved before equipment can be borrowed
- Equipment must be returned by the agreed date

## Maintenance Management

### Creating Maintenance Records

1. Navigate to Maintenance > New Record
2. Select the equipment requiring maintenance
3. Fill in maintenance details:
   - Title of maintenance task
   - Description of work needed
   - Scheduled date
4. Click "Create Record"

### Maintenance Status

Maintenance records have the following statuses:

- **Scheduled**: Maintenance planned
- **In Progress**: Work is being performed
- **Completed**: Maintenance finished

### Viewing Maintenance Records

- **Scheduled Maintenance**: View upcoming maintenance tasks
- **Active Maintenance**: View maintenance in progress
- **Completed Maintenance**: View historical maintenance records

### Managing Maintenance

1. **Start Maintenance**: Click "Start" to begin work on a scheduled task
2. **Complete Maintenance**: Click "Complete" when work is finished
3. **Add Notes**: Add comments about maintenance work performed

### Maintenance History

View complete maintenance history for any equipment:

1. Navigate to Equipment Catalog
2. Click on equipment item
3. View "Maintenance History" tab
4. See all past maintenance records and details

## AI Assistant

### Accessing AI Assistant

The AI Assistant is available in two ways:

1. **Chat Interface**: Click the chat icon in the bottom-right corner
2. **Equipment Context**: Click "Ask AI" on equipment details page

### Asking Questions

Type your question in the chat interface:

- **Equipment Usage**: "How do I use the oscilloscope?"
- **Maintenance Guidelines**: "What are the maintenance procedures for this multimeter?"
- **Safety Information**: "What safety precautions should I follow when using this equipment?"
- **General Support**: "I need help with my experiment"

### AI Context

The AI Assistant has access to:

- Equipment manuals and documentation
- Maintenance records and procedures
- Safety guidelines and SOPs
- General laboratory procedures

### AI Response Features

- **Contextual Answers**: Responses are tailored to your specific equipment and laboratory
- **Source References**: AI provides references to source documents
- **Safety Emphasis**: Safety-related answers include appropriate warnings
- **Limitations**: AI states limitations when official context is unavailable

### AI Usage Guidelines

- AI responses are advisory and do not replace professional judgment
- Always verify critical information with official documentation
- Report any AI inaccuracies to the system administrator
- Use AI as a learning tool and reference, not as a replacement for training

## Reporting and Statistics

### Equipment Statistics

View comprehensive equipment statistics:

- Total equipment count
- Equipment by group and location
- Equipment status distribution
- Equipment utilization rates

### Borrow Statistics

Analyze borrowing patterns:

- Total borrow requests
- Active vs. completed borrows
- Average borrow duration
- Borrow trends over time

### Maintenance Statistics

Track maintenance activities:

- Scheduled vs. completed maintenance
- Maintenance completion times
- Equipment failure rates
- Maintenance costs (if tracking)

### Generating Reports

1. Navigate to Reports section
2. Select report type (Equipment, Borrow, Maintenance)
3. Configure date range and filters
4. Click "Generate Report"
5. Download or print the report

## User Roles and Permissions

### Administrator

Full system access and management capabilities:

- User management (create, edit, delete users)
- System configuration
- All equipment management functions
- All borrow management functions
- All maintenance management functions
- Access to all reports and statistics
- AI assistant access

### Manager

Laboratory management capabilities:

- Equipment management
- Borrow request approval/rejection
- Maintenance management
- Report generation
- AI assistant access

### User

Basic laboratory user capabilities:

- View equipment catalog
- Create borrow requests
- View borrowed items
- Return borrowed equipment
- View maintenance records
- AI assistant access

### Technician

Maintenance-focused capabilities:

- View equipment catalog
- Create maintenance records
- Update maintenance status
- View equipment history
- AI assistant access

## Troubleshooting

### Common Issues

**Login Problems**
- Verify username and password
- Check if account is active
- Reset password if needed
- Contact administrator if issues persist

**Equipment Not Available**
- Check equipment status in catalog
- Verify equipment is not borrowed
- Check if equipment is in maintenance
- Contact manager if equipment should be available

**Borrow Request Issues**
- Ensure equipment is available
- Verify dates are within allowed range
- Check if you have permission to borrow
- Contact manager for approval issues

**AI Assistant Problems**
- Check internet connection
- Verify AI service is running
- Try rephrasing your question
- Report persistent issues to administrator

### Error Messages

**"Authentication Failed"**
- Check login credentials
- Ensure account is active
- Clear browser cache and cookies

**"Equipment Not Found"**
- Verify equipment ID
- Check if equipment exists
- Refresh the page

**"Permission Denied"**
- Verify user role and permissions
- Contact administrator if access should be granted

**"AI Service Unavailable"**
- Check internet connection
- Verify Ollama service is running
- Try again later

### Getting Help

1. **AI Assistant**: Use the built-in AI assistant for help
2. **Documentation**: Access comprehensive documentation
3. **Administrator**: Contact system administrator for technical issues
4. **Support Portal**: Submit support requests through the system

## Best Practices

### Equipment Management

- Keep equipment information up to date
- Use descriptive names and descriptions
- Regularly audit equipment inventory
- Maintain accurate location records

### Borrow System

- Plan borrow requests in advance
- Return equipment on time
- Provide accurate purpose information
- Communicate any issues with borrowed equipment

### Maintenance Management

- Schedule regular maintenance
- Document all maintenance activities
- Use standardized procedures
- Track maintenance history

### AI Assistant Usage

- Use specific, clear questions
- Verify critical information
- Report AI inaccuracies
- Use AI as a learning tool

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Open AI Assistant
- **Ctrl/Cmd + S**: Save form
- **Ctrl/Cmd + R**: Refresh page
- **Esc**: Close modal/dialog
- **Tab**: Navigate between form fields

## Mobile App Usage

The system is optimized for mobile devices:

- Responsive design adapts to screen size
- Touch-friendly interface
- Offline access to cached data
- Push notifications for important updates

## Accessibility

The system includes accessibility features:

- Screen reader compatibility
- Keyboard navigation
- High contrast mode
- Adjustable text sizes
- ARIA labels for improved accessibility

## Updates and Changelog

The system is regularly updated with new features and improvements. Check the changelog for:

- New features and enhancements
- Bug fixes and improvements
- Security updates
- Documentation updates

## Contact Information

For additional support:

- **Email**: support@ai-lems.com
- **Phone**: +1 (555) 123-4567
- **Support Portal**: Available within the system
- **Documentation**: https://docs.ai-lems.com

---

*This user guide will be updated regularly to reflect system changes and new features. For the most current information, please refer to the online documentation.*
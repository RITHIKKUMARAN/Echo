import { Router } from 'express';

const router = Router();

// Initialize course sheets
router.post('/initialize', async (req, res) => {
    try {
        const { courseId, professorEmail } = req.body;

        if (!courseId || !professorEmail) {
            return res.status(400).json({
                success: false,
                error: 'courseId and professorEmail are required'
            });
        }

        // For now, return demo/mock sheet URLs since Google Sheets API requires OAuth setup
        // In production, you'd use the Google Sheets API to create actual sheets
        const mockSheetUrls = {
            escalatedDoubtsUrl: `https://docs.google.com/spreadsheets/d/demo-${courseId}-doubts/edit`,
            topicAnalyticsUrl: `https://docs.google.com/spreadsheets/d/demo-${courseId}-analytics/edit`,
            engagementSummaryUrl: `https://docs.google.com/spreadsheets/d/demo-${courseId}-engagement/edit`,
            isDemoMode: true
        };

        res.json({
            success: true,
            sheets: mockSheetUrls
        });
    } catch (error) {
        console.error('Error initializing sheets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize sheets'
        });
    }
});

// Get course sheet URLs
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        console.log('Getting sheets for course:', courseId); // Using courseId

        // Return demo URLs
        const mockSheetUrls = {
            escalatedDoubtsUrl: `https://docs.google.com/spreadsheets/d/demo-${courseId}-doubts/edit`,
            topicAnalyticsUrl: `https://docs.google.com/spreadsheets/d/demo-${courseId}-analytics/edit`,
            engagementSummaryUrl: `https://docs.google.com/spreadsheets/d/demo-${courseId}-engagement/edit`,
            isDemoMode: true
        };

        res.json(mockSheetUrls);
    } catch (error) {
        console.error('Error fetching sheet URLs:', error);
        res.status(500).json({ error: 'Failed to fetch sheet URLs' });
    }
});

// Sync data to sheets
router.post('/sync/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        console.log('Syncing data for course:', courseId); // Using courseId

        // Prepare CSV export data (since actual Google Sheets sync requires OAuth)
        const exportData = {
            doubts: [
                ['Doubt ID', 'Content', 'Status', 'Created At', 'Student'],
                // In real implementation, fetch from Firestore
                ['Sample data - sync successful', '', '', '', '']
            ],
            topics: [
                ['Topic', 'Confusion Count', 'Status'],
                ['Sample analytics data', '0', 'OK']
            ],
            engagement: [
                ['Metric', 'Value'],
                ['Total doubts', '0'],
                ['Active students', '0']
            ]
        };

        res.json({
            success: true,
            message: 'Data synced successfully (demo mode)',
            exportData
        });
    } catch (error) {
        console.error('Error syncing sheets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync data'
        });
    }
});

// Refresh sheets
router.post('/refresh/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;

        res.json({
            success: true,
            message: 'Sheets refreshed (demo mode)'
        });
    } catch (error) {
        console.error('Error refreshing sheets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh sheets'
        });
    }
});

export default router;

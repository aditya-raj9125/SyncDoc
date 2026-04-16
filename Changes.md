Goal:
Build a real-time collaborative text editor where multiple users can edit the same document simultaneously — think Google Docs, but simpler. Changes must sync instantly across all connected users with robust conflict resolution.
Key Features:-
Real-time synchronisation of text changes across multiple users
User presence indicators — show who is online and currently editing
Cursor position tracking per user (coloured cursors)
Conflict resolution when multiple users edit the same section
Basic text formatting: bold, italic, underline
Document persistence and revision history
Technical Requirements:-
WebSocket-based real-time communication
Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs)
Backend: Node.js / Python with WebSocket support
Frontend: React / Vue.js with collaborative editing libraries
Database: PostgreSQL / MongoDB for document storage

This was my problem statemnet and a basic version is ready, we have got some reviews which is in the action, read the review and solve each and every problem.


Action:
1. Below is the review comment I got from the judges, read it carefully and work on each problem.
"Review Comment: Overall, SyncDoc showcases a strong repository structure and impressive code organization, making it a promising project for real-time collaboration. The well-documented README effectively outlines key features and the tech stack, contributing positively to the project's usability. The modular design, characterized by clear separation of components and adherence to DRY principles, is commendable and reflects good practices in code development. However, there are areas that require attention to enhance the overall quality and functionality of the project. The current sharing functionality is not operational, hindering the synchronization testing process. It is essential to address this issue promptly to ensure users can fully utilize the intended features. Additionally, while the README is comprehensive, it would greatly benefit from expanded setup instructions and detailed API documentation to assist users in getting started without confusion. Furthermore, enhancing the error handling within the codebase is crucial. Although the project is labeled as production-grade, the absence of visible try/catch blocks or input validations suggests that the robustness of the application could be improved. Implementing clear error messages and ensuring proper input validation will contribute to a more resilient application. To move forward, I recommend focusing on the following actionable steps: 1. Resolve the sharing functionality issues to enable proper synchronization testing. 2. Expand the documentation to include detailed setup instructions and API references. 3. Incorporate more visible error handling mechanisms to improve the overall user experience. With these improvements, SyncDoc has the potential to become an even more robust and user-friendly application. Keep up the good work!"

2. Solve for the speed like when i click inside any document to open, it takes around 3 to 4 sec to open, solve it.

3. When I share the document, the document must be saved to the user whom to it is shared also, like in share with me tab, make this possible using popular system design principles.

4. Also when i share the document and the user upen the shared doc just the doc edit is appearing no tabs for download, mark star etc appears as it appears in the user eho shared it, solve this also, I want the sender and receiver have the same dashboard and the same doc just the simultaneously editing, watch for teh popular such apps giving these features and use their system design.

5. Also when i click wny tab in workspace it takes around 3 to 5 sec to open, and it is the same case with documents, solve it.

6. make the doc upload features along with doc download, and doc download must be in both the user sender and receiver.

Context: A prompt if given it has the details what is till now build and how, u have some problems the project ahs in action and u have to solve it.

give me a detailed prompt to solve all the issues, amke sure to solve each and every issues, give me a detailed prompt, just give me prommt abt what to so dont give me code, coding will be done by antigravity,


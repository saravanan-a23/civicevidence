import React from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import AiChatAssistant from '../components/common/AiChatAssistant';

const DashboardLayout = ({ title, children }) => {
  return (
    <div className="app-container">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <main className="main-content">
        <Navbar title={title} />
        <div className="content-inner animate-fade-in">
          {children}
        </div>
      </main>

      {/* Floating AI Forensic Assistant */}
      <AiChatAssistant />

      <style dangerouslySetInnerHTML={{ __html: `
        .content-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
      `}} />
    </div>
  );
};

export default DashboardLayout;

"use client";

import { useState } from "react";
import { Bell, Lock, Users, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: null },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "team", label: "Team Members", icon: Users },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 border-b-2 font-medium text-sm transition ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Organization Settings</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <input
                type="text"
                defaultValue="My Company"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <div className="px-3 py-2 border border-border rounded-lg bg-muted text-foreground">
                Free
              </div>
              <p className="text-xs text-muted-foreground">
                <button className="text-primary font-semibold hover:underline">
                  Upgrade to Pro
                </button>{" "}
                to unlock premium features
              </p>
            </div>

            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Email Notifications</h3>

            {[
              { id: "churn", label: "High churn risk alerts", checked: true },
              {
                id: "insights",
                label: "Weekly AI insights digest",
                checked: true,
              },
              { id: "team", label: "Team member updates", checked: false },
              { id: "billing", label: "Billing notifications", checked: true },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={item.id}
                  defaultChecked={item.checked}
                  className="w-4 h-4"
                />
                <label
                  htmlFor={item.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {item.label}
                </label>
              </div>
            ))}

            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Team */}
      {activeTab === "team" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <button className="text-primary text-sm font-semibold hover:underline">
                Invite Member
              </button>
            </div>

            <div className="divide-y divide-border">
              {[{ name: "You", email: "user@example.com", role: "Owner" }].map(
                (member) => (
                  <div
                    key={member.email}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
              Update Password
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground">
              Delete your organization and all associated data. This action
              cannot be undone.
            </p>
            <button className="px-4 py-2 border border-destructive text-destructive rounded-lg font-semibold hover:bg-destructive/10 transition">
              Delete Organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

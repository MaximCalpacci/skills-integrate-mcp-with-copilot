document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const searchBox = document.getElementById("search-box");
  const sortSelect = document.getElementById("sort-select");
  const categoryFilter = document.getElementById("category-filter");

  let allActivities = {};

  // Helper to infer category from activity name
  function getCategory(name) {
    if (name.includes("Club")) return "Club";
    if (name.includes("Team")) return "Team";
    if (name.includes("Class")) return "Class";
    return "Other";
  }

  // Render activities with filters, sorting, and search
  function renderActivities() {
    let filtered = Object.entries(allActivities);

    // Filter by category
    const selectedCategory = categoryFilter ? categoryFilter.value : "";
    if (selectedCategory) {
      filtered = filtered.filter(([name]) => getCategory(name) === selectedCategory);
    }

    // Search
    const search = searchBox ? searchBox.value.trim().toLowerCase() : "";
    if (search) {
      filtered = filtered.filter(([name, details]) =>
        name.toLowerCase().includes(search) ||
        details.description.toLowerCase().includes(search) ||
        details.schedule.toLowerCase().includes(search)
      );
    }

    // Sort
    if (sortSelect && sortSelect.value === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortSelect && sortSelect.value === "spots") {
      filtered.sort((a, b) => {
        const spotsA = a[1].max_participants - a[1].participants.length;
        const spotsB = b[1].max_participants - b[1].participants.length;
        return spotsB - spotsA;
      });
    }

    // Render
    activitiesList.innerHTML = "";
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
        <button class="register-btn" data-activity="${name}">Register Student</button>
      `;
      activitiesList.appendChild(activityCard);
    });

    // Add event listeners
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
    document.querySelectorAll(".register-btn").forEach((button) => {
      button.addEventListener("click", handleRegister);
    });
  }

  // Fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Event listeners for controls
  if (searchBox) searchBox.addEventListener("input", renderActivities);
  if (sortSelect) sortSelect.addEventListener("change", renderActivities);
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle register functionality
  async function handleRegister(event) {
    const activity = event.target.getAttribute("data-activity");
    const email = prompt("Enter student email to register:");
    if (!email) return;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: "POST"
      });
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to register. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error registering:", error);
    }
  }

  // Initial fetch
  fetchActivities();
});

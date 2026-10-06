document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => {
        option.remove();
      });

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
          <div class="participants">
            <div class="participants-heading">
              <h5>Participants</h5>
              <span class="participant-count">${details.participants.length}</span>
            </div>
            <ul class="participant-list" aria-label="Participants for ${name}"></ul>
            <p class="participant-error hidden" aria-live="polite"></p>
          </div>
        `;

        const participantList = activityCard.querySelector(".participant-list");
        const participantCount = activityCard.querySelector(".participant-count");
        const spotsLeftCount = activityCard.querySelector(".spots-left");
        const participantError = activityCard.querySelector(".participant-error");

        function addParticipant(email) {
          const participant = document.createElement("li");
          const emailLabel = document.createElement("span");
          emailLabel.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "participant-remove";
          removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
          removeButton.title = "Remove participant";
          removeButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
            </svg>
          `;
          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            participantError.classList.add("hidden");

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Unable to remove participant");
              }

              participant.remove();
              details.participants.splice(details.participants.indexOf(email), 1);
              participantCount.textContent = details.participants.length;
              spotsLeftCount.textContent = details.max_participants - details.participants.length;

              if (details.participants.length === 0) {
                const emptyMessage = document.createElement("li");
                emptyMessage.className = "participant-empty";
                emptyMessage.textContent = "No participants yet";
                participantList.appendChild(emptyMessage);
              }
            } catch (error) {
              participantError.textContent = error.message;
              participantError.classList.remove("hidden");
              removeButton.disabled = false;
            }
          });

          participant.append(emailLabel, removeButton);
          participantList.appendChild(participant);
        }

        details.participants.forEach((email) => {
          addParticipant(email);
        });

        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "participant-empty";
          emptyMessage.textContent = "No participants yet";
          participantList.appendChild(emptyMessage);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
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
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

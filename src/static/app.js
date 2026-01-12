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
      // Reset activity select so we don't duplicate options on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p><strong>Participants:</strong></p>
          </div>
        `;

        // After inserting the static HTML, build participant items with remove buttons
        if (details.participants && details.participants.length) {
          const participantsContainer = document.createElement('div');
          participantsContainer.className = 'participants-list';

          details.participants.forEach(p => {
            const item = document.createElement('div');
            item.className = 'participant-item';

            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'remove-participant';
            btn.setAttribute('aria-label', 'Remove participant');
            btn.textContent = '✖';
            btn.dataset.activity = name;
            btn.dataset.email = p;

            item.appendChild(span);
            item.appendChild(btn);
            participantsContainer.appendChild(item);
          });

          activityCard.querySelector('.participants-section').appendChild(participantsContainer);

          // Attach click handlers for remove buttons
          participantsContainer.querySelectorAll('.remove-participant').forEach(button => {
            button.addEventListener('click', async (e) => {
              const activityName = button.dataset.activity;
              const email = button.dataset.email;

              try {
                const res = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE'
                });

                if (res.ok) {
                  // Refresh the activities list
                  fetchActivities();
                } else {
                  const err = await res.json();
                  console.error('Failed to remove participant:', err);
                }
              } catch (err) {
                console.error('Error removing participant:', err);
              }
            });
          });
        } else {
          activityCard.querySelector('.participants-section').innerHTML += `<p class="no-participants">No participants yet</p>`;
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
        // Refresh activities list to show the new participant
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
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

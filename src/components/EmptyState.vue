<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h2>Welcome to FastTab!</h2>
    <p>Create your first group to get started with organizing your AI applications.</p>
    <button class="btn-primary" @click="$emit('createFirstGroup')">
      Create Your First Group
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  createFirstGroup: []
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 40px;
}

.empty-icon {
  margin-bottom: 24px;
  color: var(--primary-color);
  opacity: 0.6;
}

h2 {
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color);
}

p {
  margin: 0 0 32px 0;
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 400px;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
}
</style>

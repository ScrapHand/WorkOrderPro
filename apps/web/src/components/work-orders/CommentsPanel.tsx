
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentService, WorkOrderComment } from "@/services/comment.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommentsPanelProps {
    workOrderId: string;
}

export function CommentsPanel({ workOrderId }: CommentsPanelProps) {
    const queryClient = useQueryClient();
    const [newComment, setNewComment] = useState("");

    const { data: comments, isLoading } = useQuery({
        queryKey: ["work-order-comments", workOrderId],
        queryFn: () => CommentService.getComments(workOrderId),
    });

    const addMutation = useMutation({
        mutationFn: (content: string) => CommentService.addComment(workOrderId, content),
        onSuccess: () => {
            setNewComment("");
            queryClient.invalidateQueries({ queryKey: ["work-order-comments", workOrderId] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || addMutation.isPending) return;
        addMutation.mutate(newComment);
    };

    return (
        <Card className="shadow-md border-gray-200">
            <CardHeader className="pb-3 border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold">Technician Collaboration</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {/* Comments List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : comments?.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm italic">
                            No comments yet. Start the conversation.
                        </div>
                    ) : (
                        comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-3 group">
                                <Avatar className="h-8 w-8 border border-gray-100 shadow-sm">
                                    <AvatarImage src={comment.user.avatarUrl} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                                        {comment.user.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-900">{comment.user.username}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-transparent group-hover:border-gray-100 transition-colors">
                                        {comment.content}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="pt-4 border-t space-y-3">
                    <Textarea
                        placeholder="Type a note or update for the next technician..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] text-sm resize-none focus:ring-blue-500 border-gray-200"
                    />
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!newComment.trim() || addMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 shadow-sm px-4"
                        >
                            {addMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : (
                                <Send className="h-3 w-3 mr-2" />
                            )}
                            Post Update
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
